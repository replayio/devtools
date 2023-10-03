export function findMatches(
  text: string,
  needle: string,
  caseSensitive: boolean
): [nonMatch: string, match: string][] {
  let tuples: [nonMatch: string, match: string][] = [];

  let safeNeedle = needle;
  let safeText = text;
  if (!caseSensitive) {
    safeNeedle = needle.toLocaleLowerCase();
    safeText = text.toLocaleLowerCase();
  }

  let pendingNonMatch = "";
  let pendingMatch = "";

  for (let index = 0; index < safeText.length; index++) {
    const textCharacter = text[index];
    const safeTextCharacter = safeText[index];

    const pendingMatchCharacterIndex = pendingMatch.length;
    const needleCharacter = safeNeedle[pendingMatchCharacterIndex];

    if (safeTextCharacter === needleCharacter) {
      pendingMatch += textCharacter;

      if (pendingMatch.length === safeNeedle.length) {
        tuples.push([pendingNonMatch, pendingMatch]);

        pendingNonMatch = "";
        pendingMatch = "";
      }
    } else {
      pendingNonMatch = pendingNonMatch + pendingMatch + textCharacter;
      pendingMatch = "";
    }

    if (index === safeText.length - 1) {
      if (pendingNonMatch || pendingMatch) {
        tuples.push([pendingNonMatch + pendingMatch, ""]);
      }
    }
  }

  return tuples;
}
