// src/lib/agitationTracker.ts

export function startAgitationTracker(onAgitationDetected: () => void) {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
    return () => {};
  }

  let accelerationHistory: number[] = [];
  let lastTrigger = 0;
  const THRESHOLD = 12; // Moderate shaking threshold
  const HISTORY_SIZE = 40;
  const COOLDOWN_MS = 60000; // 1 min cooldown to prevent spam

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
    
    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const net = Math.abs(magnitude - 9.8); // Remove baseline gravity
    
    accelerationHistory.push(net);
    if (accelerationHistory.length > HISTORY_SIZE) {
      accelerationHistory.shift();
    }
    
    const avg = accelerationHistory.reduce((a, b) => a + b, 0) / accelerationHistory.length;
    
    if (avg > THRESHOLD) {
      const now = Date.now();
      if (now - lastTrigger > COOLDOWN_MS) {
        lastTrigger = now;
        onAgitationDetected();
      }
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
