export function createAudioSystem(initialVolume = 0.7) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let unlocked = false;
  let volume = clamp01(initialVolume);

  function ensureContext() {
    if (!AudioCtx) {
      return null;
    }
    if (!ctx) {
      ctx = new AudioCtx();
    }
    return ctx;
  }

  function unlock() {
    const ac = ensureContext();
    if (!ac) {
      return;
    }
    if (ac.state === "suspended") {
      void ac.resume();
    }
    unlocked = true;
  }

  function beep(frequency, duration, type, gain = 0.1) {
    const ac = ensureContext();
    if (!ac || !unlocked) {
      return;
    }

    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const amp = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * volume), now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(amp);
    amp.connect(ac.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    unlock,
    setVolume(next) {
      volume = clamp01(next);
    },
    getVolume() {
      return volume;
    },
    playBreak() {
      beep(190, 0.06, "square", 0.09);
      setTimeout(() => beep(140, 0.05, "square", 0.08), 20);
    },
    playPlace() {
      beep(320, 0.04, "triangle", 0.08);
    },
    playStep() {
      beep(120, 0.025, "sine", 0.045);
    },
    playJump() {
      beep(430, 0.06, "triangle", 0.09);
    },
  };
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0.7;
  }
  return Math.max(0, Math.min(1, value));
}
