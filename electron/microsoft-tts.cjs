const { execFile } = require("node:child_process");
const { createHash } = require("node:crypto");
const { promises: fs } = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const { pathToFileURL } = require("node:url");

const execFileAsync = promisify(execFile);
const MAX_TTS_CHARACTERS = 20_000;
const CACHE_VERSION = "microsoft-windows-tts-v1";
const pendingSyntheses = new Map();

const POWERSHELL_SCRIPT = `
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $voices = @($synth.GetInstalledVoices() | Where-Object {
    $_.Enabled -and
    $_.VoiceInfo.Name -like "Microsoft*" -and
    $_.VoiceInfo.Culture.Name -like "en-*"
  })

  $voice = $voices | Where-Object { $_.VoiceInfo.Culture.Name -eq "en-AU" } | Select-Object -First 1
  if (-not $voice) {
    $voice = $voices | Where-Object { $_.VoiceInfo.Culture.Name -eq "en-GB" } | Select-Object -First 1
  }
  if (-not $voice) {
    $voice = $voices | Where-Object { $_.VoiceInfo.Culture.Name -eq "en-US" } | Select-Object -First 1
  }
  if (-not $voice) {
    $voice = $voices | Select-Object -First 1
  }
  if (-not $voice) {
    throw "MICROSOFT_ENGLISH_VOICE_NOT_FOUND"
  }

  $synth.SelectVoice($voice.VoiceInfo.Name)
  $synth.Rate = 0
  $synth.SetOutputToWaveFile($env:NAPLAN_TTS_OUTPUT)
  $synth.Speak($env:NAPLAN_TTS_TEXT)
  [Console]::Out.Write($voice.VoiceInfo.Name + [Environment]::NewLine + $voice.VoiceInfo.Culture.Name)
}
finally {
  $synth.Dispose()
}
`;

function validateTtsText(value) {
  if (typeof value !== "string") throw new Error("TTS_TEXT_INVALID");
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_TTS_CHARACTERS || text.includes("\0")) {
    throw new Error("TTS_TEXT_INVALID");
  }
  return text;
}

function cacheKeyForText(text) {
  return createHash("sha256")
    .update(`${CACHE_VERSION}\0${text}`)
    .digest("hex");
}

function readWaveDurationSecondsFromBuffer(buffer) {
  if (
    !Buffer.isBuffer(buffer)
    || buffer.length < 44
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("TTS_AUDIO_INVALID_WAVE");
  }

  let byteRate = 0;
  let dataSize = 0;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkStart + chunkSize > buffer.length) break;
    if (chunkId === "fmt " && chunkSize >= 12) {
      byteRate = buffer.readUInt32LE(chunkStart + 8);
    } else if (chunkId === "data") {
      dataSize += chunkSize;
    }
    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!byteRate || !dataSize) throw new Error("TTS_AUDIO_INVALID_WAVE");
  return dataSize / byteRate;
}

async function readWaveDurationSeconds(wavePath) {
  return readWaveDurationSecondsFromBuffer(await fs.readFile(wavePath));
}

async function readCachedResult(wavePath, metadataPath) {
  try {
    const [waveStat, metadata] = await Promise.all([
      fs.stat(wavePath),
      fs.readFile(metadataPath, "utf8").then(JSON.parse),
    ]);
    if (waveStat.size <= 44 || !metadata.voiceName) return null;
    const durationSeconds = Number.isFinite(Number(metadata.durationSeconds))
      && Number(metadata.durationSeconds) > 0
      ? Number(metadata.durationSeconds)
      : await readWaveDurationSeconds(wavePath);
    return {
      audioUrl: pathToFileURL(wavePath).href,
      voiceName: metadata.voiceName,
      locale: metadata.locale || "en-US",
      engine: "Microsoft Windows Speech",
      durationSeconds,
    };
  } catch {
    return null;
  }
}

async function generateSpeech({ text, wavePath, metadataPath }) {
  const windowsRoot = process.env.SystemRoot || "C:\\Windows";
  const powershellPath = path.join(
    windowsRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  const encodedCommand = Buffer.from(POWERSHELL_SCRIPT, "utf16le").toString("base64");
  const { stdout } = await execFileAsync(
    powershellPath,
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-EncodedCommand",
      encodedCommand,
    ],
    {
      windowsHide: true,
      maxBuffer: 64 * 1024,
      env: {
        ...process.env,
        NAPLAN_TTS_OUTPUT: wavePath,
        NAPLAN_TTS_TEXT: text,
      },
    },
  );

  const [voiceName = "Microsoft Windows English", locale = "en-US"] = stdout
    .trim()
    .split(/\r?\n/);
  const waveStat = await fs.stat(wavePath);
  if (waveStat.size <= 44) throw new Error("TTS_AUDIO_EMPTY");
  const durationSeconds = await readWaveDurationSeconds(wavePath);
  await fs.writeFile(
    metadataPath,
    JSON.stringify({ voiceName, locale, durationSeconds }),
    "utf8",
  );
  return {
    audioUrl: pathToFileURL(wavePath).href,
    voiceName,
    locale,
    engine: "Microsoft Windows Speech",
    durationSeconds,
  };
}

async function synthesizeMicrosoftSpeech({ text: input, cacheDir }) {
  if (process.platform !== "win32") throw new Error("MICROSOFT_TTS_REQUIRES_WINDOWS");
  const text = validateTtsText(input);
  const cacheKey = cacheKeyForText(text);
  const wavePath = path.join(cacheDir, `${cacheKey}.wav`);
  const metadataPath = path.join(cacheDir, `${cacheKey}.json`);
  await fs.mkdir(cacheDir, { recursive: true });

  const cached = await readCachedResult(wavePath, metadataPath);
  if (cached) return { ...cached, cacheKey };
  if (pendingSyntheses.has(cacheKey)) return pendingSyntheses.get(cacheKey);

  const synthesis = generateSpeech({ text, wavePath, metadataPath })
    .then((result) => ({ ...result, cacheKey }))
    .finally(() => pendingSyntheses.delete(cacheKey));
  pendingSyntheses.set(cacheKey, synthesis);
  return synthesis;
}

module.exports = {
  cacheKeyForText,
  readWaveDurationSecondsFromBuffer,
  synthesizeMicrosoftSpeech,
  validateTtsText,
};
