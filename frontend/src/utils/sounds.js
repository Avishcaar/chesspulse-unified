const BASE_SOUND_URL = 'https://lichess1.org/assets/sound';

const makeThemeUrls = (folder) => ({
  move: `${BASE_SOUND_URL}/${folder}/Move.ogg`,
  capture: `${BASE_SOUND_URL}/${folder}/Capture.ogg`,
  check: `${BASE_SOUND_URL}/${folder}/Check.ogg`,
  castle: `${BASE_SOUND_URL}/${folder}/Confirmation.ogg`,
  promote: `${BASE_SOUND_URL}/${folder}/Confirmation.ogg`,
  gameEnd: `${BASE_SOUND_URL}/${folder}/GenericNotify.ogg`,
  victory: `${BASE_SOUND_URL}/${folder}/Victory.ogg`,
  defeat: `${BASE_SOUND_URL}/${folder}/Defeat.ogg`,
  draw: `${BASE_SOUND_URL}/${folder}/Draw.ogg`,
});

const SOUND_URLS = {
  standard: makeThemeUrls('standard'),
  woodland: makeThemeUrls('woodland'),
  robot: makeThemeUrls('robot'),
  piano: makeThemeUrls('piano'),
  nes: makeThemeUrls('nes'),
  sfx: makeThemeUrls('sfx'),
  futuristic: makeThemeUrls('futuristic'),
};

SOUND_URLS.wood = SOUND_URLS.woodland;
SOUND_URLS.arcade = SOUND_URLS.robot;

export const SOUND_THEMES = [
  { id: 'atelier', name: 'Atelier (Acoustic Staunton)', desc: 'Procedural hardwood & felt drop acoustics' },
  { id: 'standard', name: 'Standard (Modern)', desc: 'Clean tactile clicks' },
  { id: 'woodland', name: 'Woodland (Acoustic)', desc: 'Organic wooden board' },
  { id: 'robot', name: 'Robot (Cybernetic)', desc: 'Crisp synthetic response' },
  { id: 'piano', name: 'Piano (Melodic)', desc: 'Harmonic acoustic notes' },
  { id: 'nes', name: 'NES (8-Bit Retro)', desc: 'Classic chiptune effects' },
  { id: 'sfx', name: 'SFX (Studio)', desc: 'Cinematic dynamic impact' },
  { id: 'futuristic', name: 'Futuristic', desc: 'Sleek telemetry chimes' },
  { id: 'silent', name: 'Silent (Mute)', desc: 'No sound effects' },
];

// Lazy AudioContext singleton for procedural synthesis
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Helper to generate a short noise buffer for tactile piece click
function createNoiseBuffer(ctx, duration = 0.02) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Procedural Web Audio Synthesis for authentic hardwood Staunton chess pieces
 * Produces instantaneous, zero-latency tactile acoustic feedback.
 */
function playProceduralAcoustic(type) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;

  if (type === 'move' || type === 'castle') {
    // 1. Hardwood Body Impact (rapid downward pitch sweep)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.05);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // 2. Felt/Wood Contact Snap (bandpass filtered noise burst)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, 0.018);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1750, now);
    filter.Q.setValueAtTime(2.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // For castling, append a second softer rook slide tap
    if (type === 'castle') {
      const castleTime = now + 0.09;
      const osc2 = ctx.createOscillator();
      const oscGain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(160, castleTime);
      osc2.frequency.exponentialRampToValueAtTime(75, castleTime + 0.04);
      oscGain2.gain.setValueAtTime(0.2, castleTime);
      oscGain2.gain.exponentialRampToValueAtTime(0.001, castleTime + 0.06);
      osc2.connect(oscGain2);
      oscGain2.connect(ctx.destination);
      osc2.start(castleTime);
      osc2.stop(castleTime + 0.07);
    }
    return true;
  }

  if (type === 'capture') {
    // Primary piece collision strike
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(230, now);
    osc1.frequency.exponentialRampToValueAtTime(55, now + 0.07);
    gain1.gain.setValueAtTime(0.38, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Displaced piece secondary impact
    const bounceTime = now + 0.022;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(140, bounceTime);
    osc2.frequency.exponentialRampToValueAtTime(45, bounceTime + 0.05);
    gain2.gain.setValueAtTime(0.25, bounceTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, bounceTime + 0.06);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(bounceTime);
    osc2.stop(bounceTime + 0.07);

    // Crisp wood knock noise
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.025);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(2.0, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    return true;
  }

  if (type === 'check') {
    // Wood move sound
    playProceduralAcoustic('move');

    // Aristocratic bronze chime / harmonic ring
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, now + 0.01); // A5 note

    chimeGain.gain.setValueAtTime(0.12, now + 0.01);
    chimeGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.42);

    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.01);
    chime.stop(now + 0.45);
    return true;
  }

  if (type === 'promote') {
    // Harmonic ascension
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.18, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.18);
    });
    return true;
  }

  if (type === 'victory' || type === 'gameEnd') {
    // Atelier Major Triad (F-A-C resolution)
    [349.23, 440.00, 523.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.16, startT);
      gain.gain.exponentialRampToValueAtTime(0.0005, startT + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.65);
    });
    return true;
  }

  if (type === 'defeat') {
    // Subdued descending minor cadence
    [440.00, 392.00, 329.63].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.1;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.15, startT);
      gain.gain.exponentialRampToValueAtTime(0.0005, startT + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.6);
    });
    return true;
  }

  if (type === 'draw') {
    // Suspended fifth resonance
    [440.00, 659.25].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    });
    return true;
  }

  return false;
}

export const playSound = (type, soundTheme = 'atelier', soundEnabled = true) => {
  if (!soundEnabled || soundTheme === 'silent') {
    return;
  }

  // If atelier is selected, use high-fidelity zero-latency procedural synthesis
  if (soundTheme === 'atelier' || !soundTheme) {
    const played = playProceduralAcoustic(type);
    if (played) return;
  }

  const themeKey = soundTheme === 'wood' ? 'woodland' : soundTheme === 'arcade' ? 'robot' : soundTheme;
  const theme = SOUND_URLS[themeKey] || SOUND_URLS.standard;
  const url = theme ? theme[type] || theme.move : null;

  if (url) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.6;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback to procedural synthesis on audio play restriction or network fail
          playProceduralAcoustic(type);
        });
      }
    } catch {
      // Fallback on error
      playProceduralAcoustic(type);
    }
  } else {
    playProceduralAcoustic(type);
  }
};

export const getMoveSound = (move, isCapture, isCheck, isCastle, isPromotion) => {
  if (isCheck) return 'check';
  if (isPromotion) return 'promote';
  if (isCastle) return 'castle';
  if (isCapture) return 'capture';
  return 'move';
};
