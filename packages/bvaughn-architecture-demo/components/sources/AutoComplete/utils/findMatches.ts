import { Property, Scope } from "@replayio/protocol";

import {
  findIndex,
  findIndexString,
  insert,
  insertString,
} from "bvaughn-architecture-demo/src/utils/array";

type Match = {
  text: string;
  weight: number;
};

export default function find(
  expressionHead: string | null,
  expressionTail: string | null,
  scopes: Scope[] | null,
  properties: Property[] | null
): string[] | null {
  if (expressionHead) {
    // We're searching the properties of an object.
    // Ignore scope values because they aren't part of that object.
    if (expressionTail) {
      const matches = findMatches(expressionTail, null, properties);
      return matches.map(match => match.text);
    } else {
      // Show all properties until a user has started narrowing things down.
      return flatten(null, properties);
    }
  } else if (expressionTail) {
    // If there's no expression head, we might be searching values in scope,
    // or we might be searching global/window properties.
    const matches = findMatches(expressionTail, scopes, properties);
    return matches.map(match => match.text);
  } else {
    return null;
  }
}

function calculateCharacterProximityWeight(delta: number): number {
  return Math.max(0, 10 - delta);
}

function calculateCharacterIndexWeight(characterIndex: number): number {
  return Math.max(0, 10 - characterIndex);
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
  needle = needle.toLowerCase();
  text = text.toLowerCase();

  let needleIndex = 0;
  let prevMatchingTextIndex = -1;
  let weight = 0;
  for (let textIndex = 0; textIndex < text.length; textIndex++) {
    const textCharacter = text.charAt(textIndex);
    const needleCharacter = needle.charAt(needleIndex);
    if (textCharacter === needleCharacter) {
      weight += calculateCharacterProximityWeight(textIndex - prevMatchingTextIndex);
      weight += calculateCharacterIndexWeight(textIndex);

      needleIndex++;

      if (needleIndex === needle.length) {
        return weight;
      }

      prevMatchingTextIndex = textIndex;
    }
  }

  return 0;
}

function compareMatch(a: Match, b: Match): number {
  if (a.weight !== b.weight) {
    // Higher weight should come first.
    return b.weight - a.weight;
  } else {
    // Shorter matches should favor shorter strings
    if (a.text.length !== b.text.length) {
      return a.text.length - b.text.length;
    } else {
      // All else being equal, sort alphabetically.
      return a.text.localeCompare(b.text);
    }
  }
}

function findIndexMatch(sortedMatches: Match[], match: Match): number {
  return findIndex<Match>(sortedMatches, match, compareMatch);
}

function insertMatch(sortedMatches: Match[], match: Match): void {
  return insert<Match>(sortedMatches, match, compareMatch);
}
