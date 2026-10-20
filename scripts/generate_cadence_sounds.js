const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, durationSeconds, generateSample) {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const blockAlign = 2; // 1 channel * 16-bit (2 bytes)
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk 1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // PCM format = 1
  buffer.writeUInt16LE(1, 22);  // mono = 1
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = generateSample(t, i, numSamples);
    // clamp -1.0 to 1.0
    const clamped = Math.max(-1, Math.min(1, sample));
    const intVal = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

const sampleRate = 44100;
const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');

// 1. Cadence UP Tone (Phase A / Inhale / Cat): 520Hz ascending gentle tone (150ms)
const cadenceUpWav = createWavBuffer(sampleRate, 0.16, (t, i, total) => {
  const progress = i / total;
  const envelope = Math.sin(progress * Math.PI); // Smooth bell envelope
  const freq = 480 + progress * 60; // 480Hz -> 540Hz
  return Math.sin(2 * Math.PI * freq * t) * envelope * 0.45;
});
fs.writeFileSync(path.join(soundsDir, 'cadence_up.wav'), cadenceUpWav);
console.log('Created cadence_up.wav');

// 2. Cadence DOWN Tone (Phase B / Exhale / Cow): 380Hz descending gentle tone (150ms)
const cadenceDownWav = createWavBuffer(sampleRate, 0.16, (t, i, total) => {
  const progress = i / total;
  const envelope = Math.sin(progress * Math.PI);
  const freq = 420 - progress * 60; // 420Hz -> 360Hz
  return Math.sin(2 * Math.PI * freq * t) * envelope * 0.45;
});
fs.writeFileSync(path.join(soundsDir, 'cadence_down.wav'), cadenceDownWav);
console.log('Created cadence_down.wav');

// 3. Rep Completion Ding: 2-tone pleasant harmonic ding (320ms)
const repDingWav = createWavBuffer(sampleRate, 0.35, (t, i, total) => {
  const attack = Math.min(1, t / 0.005);
  const decay = Math.exp(-t * 12);
  const envelope = attack * decay;
  const tone1 = Math.sin(2 * Math.PI * 880 * t) * 0.35;
  const tone2 = Math.sin(2 * Math.PI * 1320 * t) * 0.2;
  return (tone1 + tone2) * envelope;
});
fs.writeFileSync(path.join(soundsDir, 'rep_ding.wav'), repDingWav);
console.log('Created rep_ding.wav');

// 4. Standard Metronome Tick: Subtle rhythm click (35ms, 1200Hz)
const metronomeTickWav = createWavBuffer(sampleRate, 0.035, (t, i, total) => {
  const attack = Math.min(1, t / 0.002);
  const decay = Math.exp(-t * 90);
  const envelope = attack * decay;
  const tone = Math.sin(2 * Math.PI * 1200 * t) * 0.28;
  return tone * envelope;
});
fs.writeFileSync(path.join(soundsDir, 'metronome_tick.wav'), metronomeTickWav);
console.log('Created metronome_tick.wav');

// 5. Extend Point Beep: Higher pitch, crisp accented tone to cue direction reversal at extend/peak (50ms, 1750Hz)
const metronomeExtendWav = createWavBuffer(sampleRate, 0.05, (t, i, total) => {
  const attack = Math.min(1, t / 0.003);
  const decay = Math.exp(-t * 60);
  const envelope = attack * decay;
  const tone1 = Math.sin(2 * Math.PI * 1750 * t) * 0.35;
  const tone2 = Math.sin(2 * Math.PI * 2200 * t) * 0.12;
  return (tone1 + tone2) * envelope;
});
fs.writeFileSync(path.join(soundsDir, 'metronome_extend.wav'), metronomeExtendWav);
console.log('Created metronome_extend.wav');

// 6. Return Point Beep: Lower pitch, resonant grounded tone to cue reversal at return/dip (55ms, 880Hz)
const metronomeReturnWav = createWavBuffer(sampleRate, 0.055, (t, i, total) => {
  const attack = Math.min(1, t / 0.003);
  const decay = Math.exp(-t * 55);
  const envelope = attack * decay;
  const tone1 = Math.sin(2 * Math.PI * 880 * t) * 0.38;
  const tone2 = Math.sin(2 * Math.PI * 1320 * t) * 0.15;
  return (tone1 + tone2) * envelope;
});
fs.writeFileSync(path.join(soundsDir, 'metronome_return.wav'), metronomeReturnWav);
console.log('Created metronome_return.wav');

// 7. High-Pitch Warning Metronome Tick: Subtle pitch-shifted click for final seconds of a hold or prep (35ms, 1520Hz)
const metronomeTickHighWav = createWavBuffer(sampleRate, 0.035, (t, i, total) => {
  const attack = Math.min(1, t / 0.002);
  const decay = Math.exp(-t * 90);
  const envelope = attack * decay;
  const tone = Math.sin(2 * Math.PI * 1520 * t) * 0.30;
  return tone * envelope;
});
fs.writeFileSync(path.join(soundsDir, 'metronome_tick_high.wav'), metronomeTickHighWav);
console.log('Created metronome_tick_high.wav');
