// src/lib/haptics.ts

let hapticInterval: any = null;

/**
 * Creates a vibration pattern for a given duration.
 * Since some browsers limit vibration to max 1000ms, we use short overlapping pulses to simulate long continuous hums.
 */
function createPulsePattern(durationMs: number): number[] {
  const pattern = [];
  const pulseLength = 100;
  const gapLength = 50;
  let elapsed = 0;
  
  while (elapsed < durationMs) {
    pattern.push(pulseLength);
    pattern.push(gapLength);
    elapsed += pulseLength + gapLength;
  }
  return pattern;
}

export function startHapticPacing(breatheDurationMs: number = 10000) {
  stopHapticPacing();
  
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const inhaleDuration = breatheDurationMs * 0.4;
    const holdDuration = breatheDurationMs * 0.1;
    const exhaleDuration = breatheDurationMs * 0.4;
    const pauseDuration = breatheDurationMs * 0.1;
    
    const cycle = () => {
       // Inhale
       navigator.vibrate(createPulsePattern(inhaleDuration));
       
       // Exhale
       setTimeout(() => {
         navigator.vibrate(createPulsePattern(exhaleDuration));
       }, inhaleDuration + holdDuration);
    };
    
    cycle();
    hapticInterval = setInterval(cycle, breatheDurationMs);
  }
}

export function stopHapticPacing() {
  if (hapticInterval) {
    clearInterval(hapticInterval);
    hapticInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
