/** True when the last Hangul syllable has a final consonant (받침). Non-Hangul endings → false. */
export function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** Appends the right particle: josa('신발', '이', '가') → '신발이', josa('상의', '을', '를') → '상의를'. */
export function josa(word: string, withBatchim: string, withoutBatchim: string): string {
  return word + (hasBatchim(word) ? withBatchim : withoutBatchim);
}
