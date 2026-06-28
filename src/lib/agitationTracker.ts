// src/lib/agitationTracker.ts

/**
 * Agitation tracker has been decommissioned to prevent ghost triggers.
 * No hardware event listeners will be attached automatically.
 * 
 * Functions exported as no-ops for backwards compatibility with existing imports.
 */
export function startAgitationTracker(onAgitationDetected: () => void, onTransitDetected?: () => void) {
  return () => {};
}

export async function requestMotionPermission(): Promise<boolean> {
  return true; 
}
