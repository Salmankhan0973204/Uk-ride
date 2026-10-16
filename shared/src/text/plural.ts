/** "1 passenger", "4 passengers". English plurals that only add an "s". */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
