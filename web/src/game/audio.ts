let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AC = window.AudioContext || w.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const audio = context();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

type Cue = "ui" | "move" | "hit" | "skill" | "down" | "win" | "lose";

export function playCue(cue: Cue, muted: boolean) {
  if (muted) return;
  const audio = context();
  const bus = master;
  if (!audio || !bus || audio.state !== "running") return;
  const now = audio.currentTime;
  const tone = (freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) => {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + delay);
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.exponentialRampToValueAtTime(gain, now + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(now + delay);
    osc.stop(now + delay + dur + 0.02);
  };
  if (cue === "ui") tone(520, 0.07, "triangle", 0.2);
  if (cue === "move") tone(180, 0.09, "sine", 0.25);
  if (cue === "hit") {
    tone(140, 0.12, "square", 0.18);
    tone(90, 0.16, "sawtooth", 0.08);
  }
  if (cue === "skill") {
    tone(330, 0.12, "triangle", 0.16);
    tone(494, 0.16, "triangle", 0.12, 0.06);
  }
  if (cue === "down") tone(90, 0.28, "sine", 0.22);
  if (cue === "win") {
    tone(392, 0.14, "triangle", 0.16);
    tone(523, 0.16, "triangle", 0.14, 0.1);
    tone(659, 0.22, "triangle", 0.12, 0.2);
  }
  if (cue === "lose") {
    tone(220, 0.18, "sine", 0.16);
    tone(160, 0.24, "sine", 0.14, 0.12);
  }
}
