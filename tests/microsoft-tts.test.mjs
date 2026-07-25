import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  formatAudioTime,
  selectMicrosoftEnglishVoice,
} from "../src/exam/useMicrosoftTts.js";

const require = createRequire(import.meta.url);
const {
  cacheKeyForText,
  readWaveDurationSecondsFromBuffer,
  validateTtsText,
} = require("../electron/microsoft-tts.cjs");

test("audio time formatting uses real seconds and keeps unknown duration honest", () => {
  assert.equal(formatAudioTime(0), "0:00");
  assert.equal(formatAudioTime(4.9), "0:04");
  assert.equal(formatAudioTime(65), "1:05");
  assert.equal(formatAudioTime(null), "--:--");
});

test("Microsoft voice selection prefers Australian, British and US English in order", () => {
  const voices = [
    { name: "Google US English", lang: "en-US" },
    { name: "Microsoft Zira Desktop", lang: "en-US" },
    { name: "Microsoft Hazel Desktop", lang: "en-GB" },
    { name: "Microsoft Natasha Online", lang: "en-AU" },
  ];
  assert.equal(selectMicrosoftEnglishVoice(voices)?.name, "Microsoft Natasha Online");
  assert.equal(selectMicrosoftEnglishVoice(voices.slice(0, 3))?.name, "Microsoft Hazel Desktop");
  assert.equal(selectMicrosoftEnglishVoice(voices.slice(0, 2))?.name, "Microsoft Zira Desktop");
  assert.equal(selectMicrosoftEnglishVoice(voices.slice(0, 1)), null);
});

test("desktop synthesis normalises text and keys the audio cache deterministically", () => {
  assert.equal(validateTtsText("  Read   this question. "), "Read this question.");
  assert.equal(cacheKeyForText("same"), cacheKeyForText("same"));
  assert.notEqual(cacheKeyForText("first"), cacheKeyForText("second"));
  assert.throws(() => validateTtsText(""), /TTS_TEXT_INVALID/);
});

test("WAV duration is derived from its real PCM byte rate and data length", () => {
  const sampleRate = 16_000;
  const bytesPerSample = 2;
  const durationSeconds = 1.5;
  const dataSize = sampleRate * bytesPerSample * durationSeconds;
  const wave = Buffer.alloc(44 + dataSize);
  wave.write("RIFF", 0, "ascii");
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write("WAVE", 8, "ascii");
  wave.write("fmt ", 12, "ascii");
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(sampleRate, 24);
  wave.writeUInt32LE(sampleRate * bytesPerSample, 28);
  wave.writeUInt16LE(bytesPerSample, 32);
  wave.writeUInt16LE(16, 34);
  wave.write("data", 36, "ascii");
  wave.writeUInt32LE(dataSize, 40);
  assert.equal(readWaveDurationSecondsFromBuffer(wave), durationSeconds);
});

test("exam audio player has no fixed fake timeline or decorative starting progress", async () => {
  const appPath = fileURLToPath(new URL("../src/exam/App.jsx", import.meta.url));
  const stylesPath = fileURLToPath(new URL("../src/exam/styles.css", import.meta.url));
  const hookPath = fileURLToPath(new URL("../src/exam/useMicrosoftTts.js", import.meta.url));
  const [appSource, stylesSource] = await Promise.all([
    readFile(appPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const hookSource = await readFile(hookPath, "utf8");
  assert.doesNotMatch(appSource, /0:04|0:42/);
  assert.match(appSource, /formatAudioTime\(playback\.duration\)/);
  assert.match(appSource, /style=\{\{ width: `\$\{progress\}%` \}\}/);
  assert.match(stylesSource, /\.audio-track i[\s\S]*?width:\s*0;/);
  assert.match(stylesSource, /\.audio-track i[\s\S]*?left:\s*0;/);
  assert.doesNotMatch(stylesSource, /\.audio-track\.playing/);
  assert.match(hookSource, /duration:\s*finiteSeconds\(result\.durationSeconds\) \|\| null/);
  assert.match(hookSource, /status:\s*'ready'[\s\S]*?currentTime:\s*0[\s\S]*?progress:\s*0/);
  assert.match(hookSource, /useLayoutEffect\(\(\) => \{/);
  assert.match(hookSource, /playback\.sourceKey === sourceKey \? playback : EMPTY_PLAYBACK/);
});
