/** Return a shuffled copy without changing the question bank. */
export function shuffleOptions<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildChoiceOptions(correct: string, distractors: readonly string[]): string[] {
  const alternatives = [...new Set(distractors)].filter((value) => value !== correct);
  return shuffleOptions([correct, ...shuffleOptions(alternatives).slice(0, 3)]);
}
