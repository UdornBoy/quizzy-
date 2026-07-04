const MAX_POINTS = 1000;
const MIN_POINTS = 100;

/**
 * Kahoot-style scoring: full points for an instant correct answer, decaying
 * linearly to MIN_POINTS as the timer runs out. Wrong/no answer = 0.
 */
export function calculatePoints(correct, timeTakenMs, durationMs) {
  if (!correct) return 0;
  const clamped = Math.min(Math.max(timeTakenMs, 0), durationMs);
  const fraction = durationMs === 0 ? 0 : clamped / durationMs;
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * (1 - fraction));
}
