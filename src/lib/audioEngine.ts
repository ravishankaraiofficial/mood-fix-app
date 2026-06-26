let audioCtx: AudioContext | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let gainNode: GainNode | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

export function toggleSoundscape(play: boolean) {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  if (play) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Create Brown Noise (low-pass filtered white noise)
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for gain
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 400; // Base cutoff

    // Dual Oscillators (Binaural Beats)
    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 174; // Solfeggio 174 Hz (pain relief)
    osc2.frequency.value = 174 + 4; // 4 Hz difference (Theta brainwaves)

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.05; // Very subtle, calming

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseNode.start();
    osc1.start();
    osc2.start();
  } else {
    try {
      if (noiseNode) { noiseNode.stop(); noiseNode.disconnect(); }
      if (osc1) { osc1.stop(); osc1.disconnect(); }
      if (osc2) { osc2.stop(); osc2.disconnect(); }
      if (filterNode) { filterNode.disconnect(); }
      if (gainNode) { gainNode.disconnect(); }
    } catch (e) {
      // Ignore disconnect errors if nodes are already stopped
    }
  }
}

export function updateSoundscape(heartRate: number) {
  if (!filterNode || !osc2 || !audioCtx) return;
  
  // Interpolate: Lower HR = lower filter cutoff, slower binaural beat
  const targetCutoff = Math.max(200, Math.min(800, (heartRate / 60) * 300));
  const targetDiff = Math.max(2, Math.min(8, (heartRate / 60) * 3));
  
  filterNode.frequency.setTargetAtTime(targetCutoff, audioCtx.currentTime, 1);
  osc2.frequency.setTargetAtTime(174 + targetDiff, audioCtx.currentTime, 1);
}
