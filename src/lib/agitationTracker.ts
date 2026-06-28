// src/lib/agitationTracker.ts

export function startAgitationTracker(onAgitationDetected: () => void, onTransitDetected?: () => void) {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
    return () => {};
  }

  let accelerationHistory: number[] = [];
  let zHistory: number[] = []; // Track z-axis for continuous rumbling
  let lastTrigger = 0;
  const THRESHOLD = 12; 
  const TRANSIT_THRESHOLD = 1.5; // low amplitude rumble
  const HISTORY_SIZE = 40;
  const COOLDOWN_MS = 60000;

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
    
    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const net = Math.abs(magnitude - 9.8);
    
    accelerationHistory.push(net);
    if (accelerationHistory.length > HISTORY_SIZE) accelerationHistory.shift();
    
    // Check for continuous transit rumble on Z axis
    zHistory.push(Math.abs(acc.z - 9.8));
    if (zHistory.length > HISTORY_SIZE * 2) zHistory.shift(); // Longer window for transit
    
    const avg = accelerationHistory.reduce((a, b) => a + b, 0) / accelerationHistory.length;
    
    const now = Date.now();
    if (now - lastTrigger > COOLDOWN_MS) {
       // Primary agitation check
       if (avg > THRESHOLD) {
         lastTrigger = now;
         onAgitationDetected();
       } 
       /* 
       else if (zHistory.length === HISTORY_SIZE * 2 && onTransitDetected) {
         // Transit check: continuous low variance rumbling
         const avgZ = zHistory.reduce((a, b) => a + b, 0) / zHistory.length;
         let varianceZ = 0;
         zHistory.forEach(z => varianceZ += (z - avgZ) * (z - avgZ));
         varianceZ /= zHistory.length;
         
         // If vibrating steadily but not violently (walking has high variance, sitting on a train is tight)
         if (avgZ > TRANSIT_THRESHOLD && avgZ < 5.0 && varianceZ < 2.0) {
            lastTrigger = now;
            onTransitDetected();
         }
       }
       */
    }
  };

  // Attempt to listen if permission is granted implicitly
  window.addEventListener('devicemotion', handleMotion, { passive: true });

  return () => {
    window.removeEventListener('devicemotion', handleMotion);
  };
}

export async function requestMotionPermission(): Promise<boolean> {
  // iOS 13+ requires explicit permission for DeviceMotion
  if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    try {
      const permissionState = await (DeviceMotionEvent as any).requestPermission();
      return permissionState === 'granted';
    } catch (e) {
      console.warn("Permission rejected", e);
      return false;
    }
  }
  return true; // Android / Older iOS
}
