export function validateQuiz(quiz) {
  if (!quiz || typeof quiz !== 'object') return 'Quiz is required';
  if (!quiz.title || typeof quiz.title !== 'string' || !quiz.title.trim()) {
    return 'Quiz title is required';
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return 'At least one question is required';
  }
  for (const [i, q] of quiz.questions.entries()) {
    if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
      return `Question ${i + 1} needs text`;
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4) {
      return `Question ${i + 1} needs 2-4 choices`;
    }
    if (q.choices.some((c) => typeof c !== 'string' || !c.trim())) {
      return `Question ${i + 1} has an empty choice`;
    }
    if (
      typeof q.correctIndex !== 'number' ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.choices.length
    ) {
      return `Question ${i + 1} needs a valid correct answer`;
    }
    if (
      typeof q.durationSeconds !== 'number' ||
      q.durationSeconds < 5 ||
      q.durationSeconds > 120
    ) {
      return `Question ${i + 1} needs a timer between 5 and 120 seconds`;
    }
  }
  return null;
}

export function sanitizeText(str, maxLen) {
  return String(str ?? '').trim().slice(0, maxLen);
}
