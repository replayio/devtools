import { SearchPromise } from "../typeahead/types";
import { Match } from "./types";
import { findIndex, insert } from "./utils/array";

export default function findMatchingCodeCompletions(
  query: string,
  queryAdditionalData: string | null
): SearchPromise<Match> {
  // Remove leading "."
  query = query.slice(1);

  const cancel = () => {
    // No-op since this implementation is synchronous
  };

  if (query === "" && queryAdditionalData === "") {
    return {
      cancel,
      promise: Promise.resolve([]),
    };
  }

  let value = null;
  try {
    // eslint-disable-next-line no-eval
    value = eval(queryAdditionalData || "window");
  } catch (error) {
    // No-op
  }

  if (value === null) {
    return {
      cancel,
      promise: Promise.resolve([]),
    };
  }

  let propertyDescriptors: TypedPropertyDescriptor<any> | null = null;
  try {
    if (typeof value === "object") {
      propertyDescriptors = Object.getOwnPropertyDescriptors(value);
    } else if (value.prototype != null && typeof value.constructor === "object") {
      propertyDescriptors = Object.getOwnPropertyDescriptors(value.constructor);
    }
  } catch (error) {
    // No-op
  }

  const keys = propertyDescriptors !== null ? Object.keys(propertyDescriptors) : null;
  if (keys === null || keys.length === 0) {
    return {
      cancel,
      promise: Promise.resolve([]),
    };
  }

  const queryRegExp = new RegExp(
    query.replace(/./g, char =>
      /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(char) ? `\\${char}.*` : `${char}.*`
    ),
    "i"
  );

  const matches: Match[] = [];
  keys.forEach(text => {
    if (text.match(queryRegExp) !== null) {
      const weight = getMatchWeight(text, query);
      const match: Match = { text, weight };
      if (findIndexMatch(matches, match) < 0) {
        insertMatch(matches, match);
      }
    }
  });

  return {
    cancel,
    promise: Promise.resolve(matches),
  };
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

function calculateCharacterProximityWeight(delta: number): number {
  return Math.max(0, 10 - delta);
}

function calculateCharacterIndexWeight(characterIndex: number): number {
  return Math.max(0, 10 - characterIndex);
}
