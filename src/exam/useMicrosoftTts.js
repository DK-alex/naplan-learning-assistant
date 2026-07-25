import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const EMPTY_PLAYBACK = Object.freeze({
  status: 'idle',
  currentTime: 0,
  duration: null,
  progress: 0,
  voiceName: '',
  error: '',
});

function finiteSeconds(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
}

export function formatAudioTime(value, unknown = '--:--') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return unknown;
  const seconds = Math.max(0, Math.floor(Number(value)));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function selectMicrosoftEnglishVoice(voices = []) {
  const microsoftEnglish = voices.filter((voice) => (
    /microsoft/i.test(String(voice?.name || ''))
    && /^en(?:-|_)/i.test(String(voice?.lang || ''))
  ));
  const localePriority = ['en-AU', 'en-GB', 'en-US'];
  for (const locale of localePriority) {
    const match = microsoftEnglish.find((voice) => (
      String(voice.lang).replace('_', '-').toLowerCase() === locale.toLowerCase()
    ));
    if (match) return match;
  }
  return microsoftEnglish[0] ?? null;
}

function browserVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  const available = window.speechSynthesis.getVoices();
  if (available.length) return Promise.resolve(available);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish);
    window.setTimeout(finish, 750);
  });
}

export function useMicrosoftTts({ text, playbackKey }) {
  const sourceKey = `${playbackKey ?? ''}\0${text ?? ''}`;
  const [playback, setPlayback] = useState(() => ({ ...EMPTY_PLAYBACK, sourceKey }));
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const requestRef = useRef(0);

  const cancelCurrent = useCallback((reset = true) => {
    requestRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    if (reset) setPlayback(EMPTY_PLAYBACK);
  }, []);

  const startBrowserSpeech = useCallback(async (speechText, requestId) => {
    if (!('speechSynthesis' in window)) throw new Error('Microsoft TTS is not available.');
    const voice = selectMicrosoftEnglishVoice(await browserVoices());
    if (requestRef.current !== requestId) return;
    if (!voice) throw new Error('Install a Microsoft English voice in Windows Speech settings.');

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-AU';
    utterance.rate = 1;
    utteranceRef.current = utterance;
    utterance.onstart = () => {
      if (requestRef.current !== requestId) return;
      setPlayback((current) => ({
        ...current,
        status: 'playing',
        voiceName: voice.name,
        error: '',
      }));
    };
    utterance.onboundary = (event) => {
      if (requestRef.current !== requestId) return;
      const currentTime = finiteSeconds(event.elapsedTime);
      const progress = Math.min(0.99, Math.max(0, event.charIndex / Math.max(1, speechText.length)));
      setPlayback((current) => ({ ...current, currentTime, progress }));
    };
    utterance.onend = (event) => {
      if (requestRef.current !== requestId) return;
      const duration = finiteSeconds(event.elapsedTime);
      utteranceRef.current = null;
      setPlayback((current) => ({
        ...current,
        status: 'ended',
        currentTime: duration,
        duration,
        progress: 1,
      }));
    };
    utterance.onerror = () => {
      if (requestRef.current !== requestId) return;
      utteranceRef.current = null;
      setPlayback((current) => ({
        ...current,
        status: 'error',
        error: 'Microsoft TTS could not play this question.',
      }));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const prepareDesktopSpeech = useCallback(async (speechText, requestId) => {
    const result = await window.desktopTts.synthesize({ text: speechText });
    if (requestRef.current !== requestId) return null;

    const audio = new Audio(result.audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;
    const syncTime = () => {
      if (requestRef.current !== requestId) return;
      const currentTime = finiteSeconds(audio.currentTime);
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
      setPlayback((current) => ({
        ...current,
        currentTime,
        duration,
        progress: duration ? Math.min(1, Math.max(0, currentTime / duration)) : 0,
      }));
    };
    audio.addEventListener('loadedmetadata', syncTime);
    audio.addEventListener('durationchange', syncTime);
    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('play', () => {
      if (requestRef.current !== requestId) return;
      setPlayback((current) => ({ ...current, status: 'playing', error: '' }));
    });
    audio.addEventListener('pause', () => {
      if (requestRef.current !== requestId || audio.ended) return;
      setPlayback((current) => ({ ...current, status: 'paused' }));
    });
    audio.addEventListener('ended', () => {
      if (requestRef.current !== requestId) return;
      syncTime();
      setPlayback((current) => ({ ...current, status: 'ended', progress: 1 }));
    });
    audio.addEventListener('error', () => {
      if (requestRef.current !== requestId) return;
      setPlayback((current) => ({
        ...current,
        status: 'error',
        error: 'Microsoft TTS audio could not be loaded.',
      }));
    });
    setPlayback((current) => ({
      ...current,
      status: 'ready',
      currentTime: 0,
      duration: finiteSeconds(result.durationSeconds) || null,
      progress: 0,
      voiceName: result.voiceName || 'Microsoft Windows English',
      error: '',
    }));
    audio.load();
    return audio;
  }, []);

  const startDesktopSpeech = useCallback(async (speechText, requestId) => {
    const audio = await prepareDesktopSpeech(speechText, requestId);
    if (audio && requestRef.current === requestId) await audio.play();
  }, [prepareDesktopSpeech]);

  useLayoutEffect(() => {
    cancelCurrent();
    const speechText = String(text || '').trim();
    if (!speechText || !window.desktopTts?.synthesize) {
      return () => cancelCurrent(false);
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPlayback({ ...EMPTY_PLAYBACK, status: 'loading', sourceKey });
    prepareDesktopSpeech(speechText, requestId).catch((error) => {
      if (requestRef.current !== requestId) return;
      audioRef.current = null;
      setPlayback((current) => ({
        ...current,
        status: 'error',
        error: error?.message || 'Microsoft TTS could not prepare this question.',
      }));
    });
    return () => cancelCurrent(false);
  }, [cancelCurrent, prepareDesktopSpeech, sourceKey, text]);

  const toggle = useCallback(async () => {
    if (!String(text || '').trim() || playback.status === 'loading') return;
    if (audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        return;
      }
      const atEnd = audioRef.current.ended || (
        Number.isFinite(audioRef.current.duration)
        && audioRef.current.duration > 0
        && audioRef.current.currentTime >= audioRef.current.duration - 0.05
      );
      if (atEnd) {
        audioRef.current.currentTime = 0;
        setPlayback((current) => ({
          ...current,
          status: 'paused',
          currentTime: 0,
          progress: 0,
        }));
      }
      await audioRef.current.play();
      return;
    }
    if (utteranceRef.current) {
      if (playback.status === 'playing') {
        window.speechSynthesis.pause();
        setPlayback((current) => ({ ...current, status: 'paused' }));
      } else {
        window.speechSynthesis.resume();
        setPlayback((current) => ({ ...current, status: 'playing' }));
      }
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPlayback({ ...EMPTY_PLAYBACK, status: 'loading', sourceKey });
    try {
      if (window.desktopTts?.synthesize) await startDesktopSpeech(text, requestId);
      else await startBrowserSpeech(text, requestId);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      audioRef.current = null;
      utteranceRef.current = null;
      setPlayback((current) => ({
        ...current,
        status: 'error',
        error: error?.message || 'Microsoft TTS could not start.',
      }));
    }
  }, [playback.status, sourceKey, startBrowserSpeech, startDesktopSpeech, text]);

  const visiblePlayback = playback.sourceKey === sourceKey ? playback : EMPTY_PLAYBACK;
  return { ...visiblePlayback, toggle, reset: cancelCurrent };
}
