import { Property, Scope } from "@replayio/protocol";

import { findIndex, findIndexString, insert, insertString } from "replay-next/src/utils/array";

type Match = {
  text: string;
  weight: number;
};

const IdentifierRegex = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

export default function findMatchingScopesAndProperties(
  queryScope: string | null,
  query: string | null,
  scopes: Scope[] | null,
  properties: Property[] | null
): string[] | null {
  matchComparator = query ? createComparatorForNeedle(query) : null;

  let names: string[] | null = null;
  if (queryScope) {
    // We're searching the properties of an object.
    // Ignore scope values because they aren't part of that object.
    if (query) {
      const matches = findMatches(query, null, properties);
      names = matches.map(match => match.text);
    } else {
      // Show all properties until a user has started narrowing things down.
      names = flatten(null, properties);
    }
  } else if (query) {
    // If there's no expression head, we might be searching values in scope,
    // or we might be searching global/window properties.
    const matches = findMatches(query, scopes, properties);
    names = matches.map(match => match.text);
  }

  // Type-ahead should not suggest numeric values (e.g. array indices)
  // or any other name that would require bracket notation.
  if (names) {
    names = names.filter(name => name.match(IdentifierRegex));
  }

  return names;
}

function flatten(scopes: Scope[] | null, properties: Property[] | null): string[] {
  const matches: string[] = [];

  if (scopes) {
    scopes.forEach(scope => {
      scope.bindings?.forEach(({ name }) => {
        if (findIndexString(matches, name) < 0) {
          insertString(matches, name);
        }
      });
    });
  }

  if (properties) {
    properties.forEach(({ name }) => {
      if (findIndexString(matches, name) < 0) {
        insertString(matches, name);
      }
    });
  }

  return matches;
}

function findMatches(
  needle: string,
  scopes: Scope[] | null,
  properties: Property[] | null
): Match[] {
  const matches: Match[] = [];

  // Filter out non-matching items quickly (before doing the heavier work of computing a score)
  const needleRegExp = new RegExp(
    needle.replace(/./g, char =>
      /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(char) ? `\\${char}.*` : `${char}.*`
    ),
    "i"
  );

  if (scopes) {
    scopes.forEach(scope => {
      scope.bindings?.forEach(({ name }) => {
        if (name.match(needleRegExp) !== null) {
          const weight = getMatchWeight(name, needle);
          const match: Match = { text: name, weight };
          if (findIndexMatch(matches, match) < 0) {
            insertMatch(matches, match);
          }
        }
      });
    });
  }

  if (properties) {
    properties.forEach(({ name }) => {
      if (name.match(needleRegExp) !== null) {
        const weight = getMatchWeight(name, needle);
        const match: Match = { text: name, weight };
        if (findIndexMatch(matches, match) < 0) {
          insertMatch(matches, match);
        }
      }
    });
  }

  return matches;
}

function getMatchWeight(text: string, needle: string): number {
  let matchingSubstringLength = 0;
  let needleIndex = 0;
  let textIndex = 0;
  let weight = 0;

  while (needleIndex < needle.length && textIndex < text.length) {
    const textCharacter = text.charAt(textIndex);
    const needleCharacter = needle.charAt(needleIndex);

    if (textCharacter.toLowerCase() === needleCharacter.toLowerCase()) {
      matchingSubstringLength++;

      needleIndex++;
      textIndex++;
    } else {
      if (matchingSubstringLength > 0) {
        weight += matchingSubstringLength * matchingSubstringLength;

        matchingSubstringLength = 0;
      }

      textIndex++;
    }
  }

  // No match (or incomplete match)
  if (needleIndex < needle.length - 1) {
    return 0;
  }

  if (matchingSubstringLength > 0) {
    weight += matchingSubstringLength * matchingSubstringLength;
  }

  return weight;
}

type MatchComparator = (a: Match, b: Match) => number;

let matchComparator: MatchComparator | null = null;

// Match ranking is as follows:
// 1. Matches that begin with the needle (case-sensitive comparison) should come first.
// 2. Matches that begin with the needle (case-insensitive comparison) should come second.
// 3. Matches with the longest matching substring group(s) should come third.
// 4. All else being equal, fall back to locale comparison.
function createComparatorForNeedle(needle: string): MatchComparator {
  const lowerCaseNeedle = needle.toLowerCase();

  return (a: Match, b: Match) => {
    const aStart = a.text.startsWith(needle);
    const bStart = b.text.startsWith(needle);
    if (aStart != bStart) {
      return aStart ? -1 : 1;
    }

    const aStartLowerCase = a.text.toLowerCase().startsWith(lowerCaseNeedle);
    const bStartLowerCase = b.text.toLowerCase().startsWith(lowerCaseNeedle);
    if (aStartLowerCase != bStartLowerCase) {
      return aStartLowerCase ? -1 : 1;
    }

    if (a.weight !== b.weight) {
      return b.weight - a.weight;
    }

    return a.text.localeCompare(b.text);
  };
}

function findIndexMatch(sortedMatches: Match[], match: Match): number {
  return findIndex<Match>(sortedMatches, match, matchComparator!);
}

function insertMatch(sortedMatches: Match[], match: Match): Match[] {
  return insert<Match>(sortedMatches, match, matchComparator!);
}
