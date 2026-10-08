/**
 * Web Audio API procedural sound synthesizer for ChronoNote
 * Zero external audio assets required - completely self-contained & offline
 */

let audioCtx: AudioContext | null = null;
let ambientGainNode: GainNode | null = null;
let ambientSourceNode: AudioNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a crisp mechanical typewriter / keyboard click
 */
export function playTypewriterSound(isEnter = false): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (isEnter) {
      // Enter key: pleasant chime / lever sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    // Normal key: snappy mechanical impulse + resonant body
    const osc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Randomize pitch slightly for organic acoustic realism
    const pitch = 1800 + (Math.random() * 400 - 200);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    // Ignore audio permission or context errors
  }
}

/**
 * Start or stop procedural ambient sound (Rain / Fire / None)
 */
export function setAmbientSound(type: 'none' | 'rain' | 'fire'): void {
  try {
    const ctx = getAudioContext();

    // Stop current ambient
    if (ambientSourceNode) {
      try {
        if ('stop' in ambientSourceNode) {
          (ambientSourceNode as AudioScheduledSourceNode).stop();
        }
        ambientSourceNode.disconnect();
      } catch {}
      ambientSourceNode = null;
    }

    if (type === 'none') return;

    // Generate 5-second buffer of colored noise
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain') {
        // Pink-like smooth rain noise
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
      } else {
        // Hearth fire crackle noise
        const crackle = Math.random() > 0.992 ? (Math.random() * 2 - 1) * 2 : 0;
        data[i] = ((lastOut + 0.05 * white) / 1.05) + crackle * 0.3;
        lastOut = data[i];
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'rain' ? 800 : 600;

    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(0.04, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(ambientGainNode);
    ambientGainNode.connect(ctx.destination);

    noiseSource.start();
    ambientSourceNode = noiseSource;
  } catch (e) {
    console.warn('Ambient sound playback error:', e);
  }
}

/**
 * Play a resonant Zen singing bowl / bell chime for Pomodoro focus
 */
export function playZenBellSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies for Tibetan singing bowl (528 Hz Love/DNA frequency + overtones)
    const freqs = [528, 1056, 1584];
    const gains = [0.25, 0.08, 0.03];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.0);
    });
  } catch (err) {
    // Ignore audio permission or context errors
  }
}

/**
 * Play card flip swoosh acoustic feedback
 */
export function playFlipCardSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {}
}

/**
 * Play upbeat success chime
 */
export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two pleasant ascending notes: C6 (1046.5) -> E6 (1318.5)
    [
      { f: 1046.5, t: 0, d: 0.18 },
      { f: 1318.5, t: 0.1, d: 0.28 }
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.12, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  } catch (err) {}
}

