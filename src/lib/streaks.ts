import { getRecentMoodLogs, getRecentJournals } from './db';

export async function calculateStreak(): Promise<number> {
  try {
    // Query last 100 days
    const logs = await getRecentMoodLogs(100 * 24);
    const journals = await getRecentJournals(100 * 24);

    const allTimestamps = [
      ...logs.map(l => l.timestamp),
      ...journals.map(j => j.timestamp)
    ].sort((a, b) => b - a); // Descending

    if (allTimestamps.length === 0) return 0;

    // Normalize to start of day in local timezone
    const normalizeDate = (ts: number) => {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const uniqueDays = Array.from(new Set(allTimestamps.map(normalizeDate))).sort((a, b) => b - a);

    const today = normalizeDate(Date.now());
    let currentStreak = 0;
    
    // Streak logic: check if the user has been active today or yesterday
    if (uniqueDays[0] !== today && uniqueDays[0] !== today - 86400000) {
      return 0; // Streak broken
    }

    let expectedDay = uniqueDays[0];
    for (const day of uniqueDays) {
      if (day === expectedDay) {
        currentStreak++;
        expectedDay -= 86400000; // Subtract 1 day in ms
      } else {
        break;
      }
    }

    return currentStreak;
  } catch (e) {
    console.warn("Streak calculation failed", e);
    return 0;
  }
}
