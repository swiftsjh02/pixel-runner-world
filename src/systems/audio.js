export function createAudioSystem(initialVolume = 0.7) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let unlocked = false;
  let volume = Math.max(0, Math.min(1, initialVolume));

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
      ac.resume();
    }
    unlocked = true;
  }

  function beep({ frequency, duration, type = "square", gain = 0.1 }) {
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
    osc.stop(now + duration + 0.03);
  }

  return {
    unlock,
    setVolume(next) {
      volume = Math.max(0, Math.min(1, next));
    },
    playJump() {
      beep({ frequency: 420, duration: 0.08, type: "square", gain: 0.1 });
    },
    playDash() {
      beep({ frequency: 250, duration: 0.05, type: "sawtooth", gain: 0.08 });
    },
    playCoin() {
      beep({ frequency: 880, duration: 0.08, type: "triangle", gain: 0.13 });
    },
    playHeart() {
      beep({ frequency: 600, duration: 0.06, type: "triangle", gain: 0.1 });
      setTimeout(() => beep({ frequency: 760, duration: 0.08, type: "triangle", gain: 0.1 }), 35);
    },
    playHurt() {
      beep({ frequency: 160, duration: 0.14, type: "square", gain: 0.12 });
    },
    playClear() {
      beep({ frequency: 520, duration: 0.08, type: "triangle", gain: 0.11 });
      setTimeout(() => beep({ frequency: 660, duration: 0.1, type: "triangle", gain: 0.11 }), 90);
      setTimeout(() => beep({ frequency: 830, duration: 0.12, type: "triangle", gain: 0.11 }), 180);
    },
  };
}
