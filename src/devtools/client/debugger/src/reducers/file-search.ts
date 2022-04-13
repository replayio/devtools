/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { AnyAction } from "@reduxjs/toolkit";
import type { UIState } from "ui/state";

/**
 * File Search reducer
 * @module reducers/fileSearch
 */

import { prefs } from "../utils/prefs";

type Modifiers = {
  caseSensitive: boolean;
  wholeWord: boolean;
  regexMatch: boolean;
};

type MatchedLocations = {
  line: number;
  ch: number;
};

type SearchResults = {
  matches: MatchedLocations[];
  matchIndex: number;
  index: number;
  count: number;
};

export interface FileSearchState {
  searchResults: SearchResults;
  query: string;
  modifiers: Modifiers;
}

const emptySearchResults: SearchResults = Object.freeze({
  matches: [],
  matchIndex: -1,
  index: -1,
  count: 0,
});

export const createFileSearchState = (): FileSearchState => ({
  query: "",
  searchResults: emptySearchResults,
  modifiers: {
    caseSensitive: prefs.fileSearchCaseSensitive as boolean,
    wholeWord: prefs.fileSearchWholeWord as boolean,
    regexMatch: prefs.fileSearchRegexMatch as boolean,
  },
});

function update(state = createFileSearchState(), action: AnyAction) {
  switch (action.type) {
    case "UPDATE_FILE_SEARCH_QUERY": {
      return { ...state, query: action.query };
    }

    case "UPDATE_SEARCH_RESULTS": {
      return { ...state, searchResults: action.results };
    }

    case "TOGGLE_FILE_SEARCH_MODIFIER": {
      const actionVal = !state.modifiers[action.modifier as keyof Modifiers];

      if (action.modifier == "caseSensitive") {
        prefs.fileSearchCaseSensitive = actionVal;
      }

      if (action.modifier == "wholeWord") {
        prefs.fileSearchWholeWord = actionVal;
      }

      if (action.modifier == "regexMatch") {
        prefs.fileSearchRegexMatch = actionVal;
      }

      return {
        ...state,
        modifiers: { ...state.modifiers, [action.modifier]: actionVal },
      };
    }

    default: {
      return state;
    }
  }
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185

export function getFileSearchQuery(state: UIState) {
  return state.fileSearch.query;
}

export function getFileSearchModifiers(state: UIState) {
  return state.fileSearch.modifiers;
}

export function getFileSearchResults(state: UIState) {
  return state.fileSearch.searchResults;
}

export default update;
