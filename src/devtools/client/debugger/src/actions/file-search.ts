/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { UIThunkAction } from "ui/actions";
import type { Context } from "../reducers/pause";

import { closeActiveSearch, clearHighlightLineRange } from "../reducers/ui";
import { getFileSearchModifiers, getFileSearchQuery, getFileSearchResults } from "../selectors";
import { getSelectedSourceWithContent, isFulfilled } from "ui/reducers/sources";

import {
  clearSearch,
  find,
  findNext,
  findPrev,
  removeOverlay,
  searchSourceForHighlight,
} from "../utils/editor";
import { getMatches } from "../workers/search";

type $FixTypeLater = any;

export function doSearch(cx: Context, query: string, editor: $FixTypeLater): UIThunkAction {
  return (dispatch, getState) => {
    const selectedSource = getSelectedSourceWithContent(getState());
    if (!selectedSource || !selectedSource.value) {
      return;
    }

    dispatch(setFileSearchQuery(cx, query));
    dispatch(searchContents(cx, query, editor));
  };
}

export function doSearchForHighlight(
  query: string,
  editor: $FixTypeLater,
  line: number,
  ch: number
): UIThunkAction {
  return async (dispatch, getState) => {
    const selectedSource = getSelectedSourceWithContent(getState());
    if (!selectedSource || !selectedSource.value) {
      return;
    }
    dispatch(searchContentsForHighlight(query, editor, line, ch));
  };
}

export function setFileSearchQuery(cx: Context, query: string) {
  return {
    type: "UPDATE_FILE_SEARCH_QUERY",
    cx,
    query,
  };
}

export function toggleFileSearchModifier(
  cx: Context,
  modifier: "regexMatch" | "caseSensitive" | "wholeWord"
) {
  return { type: "TOGGLE_FILE_SEARCH_MODIFIER", cx, modifier };
}

interface SearchMatch {
  line: number;
  ch: number;
}

export function updateSearchResults(
  cx: Context,
  characterIndex: number,
  line: number,
  matches: SearchMatch[]
) {
  const matchIndex = matches.findIndex(elm => elm.line === line && elm.ch === characterIndex);

  return {
    type: "UPDATE_SEARCH_RESULTS",
    cx,
    results: {
      matches,
      matchIndex,
      count: matches.length,
      index: characterIndex,
    },
  };
}

export function searchContents(
  cx: Context,
  query: string,
  editor: $FixTypeLater,
  focusFirstResult = true
): UIThunkAction {
  return async (dispatch, getState) => {
    const modifiers = getFileSearchModifiers(getState());
    const selectedSource = getSelectedSourceWithContent(getState());

    if (
      !editor ||
      !selectedSource ||
      !selectedSource.value ||
      !isFulfilled(selectedSource) ||
      !modifiers
    ) {
      return;
    }
    const selectedContent = selectedSource.value;

    const ctx = { ed: editor, cm: editor.codeMirror };

    if (!query) {
      clearSearch(ctx.cm, query);
      return;
    }

    const text = selectedContent.value;
    const matches = await getMatches(query, text, modifiers);

    const res = find(ctx, query, true, modifiers, focusFirstResult);
    if (!res) {
      return;
    }

    const { ch, line } = res;

    dispatch(updateSearchResults(cx, ch, line, matches));
  };
}

export function searchContentsForHighlight(
  query: string,
  editor: $FixTypeLater,
  line: number,
  ch: number
): UIThunkAction {
  return async (dispatch, getState) => {
    const modifiers = getFileSearchModifiers(getState());
    const selectedSource = getSelectedSourceWithContent(getState());

    if (!query || !editor || !selectedSource || !selectedSource.value || !modifiers) {
      return;
    }

    const ctx = { ed: editor, cm: editor.codeMirror };
    searchSourceForHighlight(ctx, false, query, true, modifiers, line, ch);
  };
}

export function traverseResults(cx: Context, rev: boolean, editor: $FixTypeLater): UIThunkAction {
  return async (dispatch, getState) => {
    if (!editor) {
      return;
    }

    const ctx = { ed: editor, cm: editor.codeMirror };

    const query = getFileSearchQuery(getState());
    const modifiers = getFileSearchModifiers(getState());
    const { matches } = getFileSearchResults(getState());

    if (query === "") {
      const { setActiveSearch } = await import("./ui");
      dispatch(setActiveSearch("file"));
    }

    if (modifiers) {
      const matchedLocations = matches || [];
      const findArgs = [ctx, query, true, modifiers];
      // @ts-expect-error ignore args spreading
      const results = rev ? findPrev(...findArgs) : findNext(...findArgs);

      if (!results) {
        return;
      }
      const { ch, line } = results;
      dispatch(updateSearchResults(cx, ch, line, matchedLocations));
    }
  };
}

export function closeFileSearch(cx: Context, editor: $FixTypeLater): UIThunkAction {
  return (dispatch, getState) => {
    if (editor) {
      const query = getFileSearchQuery(getState());
      const ctx = { ed: editor, cm: editor.codeMirror };
      removeOverlay(ctx, query);
    }

    dispatch(setFileSearchQuery(cx, ""));
    dispatch(closeActiveSearch());
    dispatch(clearHighlightLineRange());
  };
}
