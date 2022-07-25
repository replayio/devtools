/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import buildQuery, { SearchQueryModifiers } from "../build-query";
import { EditorWithDoc } from "./source-editor";

interface CharLocation {
  line: number;
  ch: number;
}

type $FixTypeLater = any;

/**
 * @memberof utils/source-search
 * @static
 */
function getSearchCursor(
  cm: $FixTypeLater,
  query: string,
  pos: CharLocation | null,
  modifiers: SearchQueryModifiers
) {
  const regexQuery = buildQuery(query, modifiers, { isGlobal: true });
  return cm.getSearchCursor(regexQuery, pos);
}

interface SearchStateType {
  posFrom: CharLocation | null;
  posTo: CharLocation | null;
  query: string | null;
  overlay: $FixTypeLater | null;
  results: $FixTypeLater[];
}

/**
 * @memberof utils/source-search
 * @static
 */
function SearchState(this: SearchStateType) {
  this.posFrom = this.posTo = this.query = null;
  this.overlay = null;
  this.results = [];
}

/**
 * @memberof utils/source-search
 * @static
 */
function getSearchState(cm: $FixTypeLater): SearchStateType {
  // @ts-expect-error weird "new" error
  const state = cm.state.search || (cm.state.search = new SearchState());
  return state;
}

function isWhitespace(query: string) {
  return !query.match(/\S/);
}

/**
 * This returns a mode object used by CoeMirror's addOverlay function
 * to parse and style tokens in the file.
 * The mode object contains a tokenizer function (token) which takes
 * a character stream as input, advances it a character at a time,
 * and returns style(s) for that token. For more details see
 * https://codemirror.net/doc/manual.html#modeapi
 *
 * Also the token function code is mainly based of work done
 * by the chrome devtools team. Thanks guys! :)
 *
 * @memberof utils/source-search
 * @static
 */
function searchOverlay(query: string, modifiers: SearchQueryModifiers) {
  const regexQuery = buildQuery(query, modifiers, {
    ignoreSpaces: true,
    // regex must be global for the overlay
    isGlobal: true,
  });

  return {
    token: function (stream: $FixTypeLater) {
      // set the last index to be the current stream position
      // this acts as an offset
      regexQuery.lastIndex = stream.pos;
      const match = regexQuery.exec(stream.string);
      if (match && match.index === stream.pos) {
        // if we have a match at the current stream position
        // set the class for a match
        stream.pos += match[0].length || 1;
        return "highlight highlight-full";
      } else if (match) {
        // if we have a match somewhere in the line, go to that point in the
        // stream
        stream.pos = match.index;
      } else {
        // if we have no matches in this line, skip to the end of the line
        stream.skipToEnd();
      }
    },
  };
}

/**
 * @memberof utils/source-search
 * @static
 */
function updateOverlay(
  cm: $FixTypeLater,
  state: SearchStateType,
  query: string,
  modifiers: SearchQueryModifiers
) {
  cm.removeOverlay(state.overlay);
  state.overlay = searchOverlay(query, modifiers);
  cm.addOverlay(state.overlay, { opaque: false });
}

function updateCursor(cm: $FixTypeLater, state: SearchStateType, keepSelection: boolean) {
  state.posTo = cm.getCursor("anchor");
  state.posFrom = cm.getCursor("head");

  if (!keepSelection) {
    state.posTo = { line: 0, ch: 0 };
    state.posFrom = { line: 0, ch: 0 };
  }
}

export function getMatchIndex(count: number, currentIndex: number, reverse: boolean) {
  if (!reverse) {
    if (currentIndex == count - 1) {
      return 0;
    }

    return currentIndex + 1;
  }

  if (currentIndex == 0) {
    return count - 1;
  }

  return currentIndex - 1;
}

/**
 * If there's a saved search, selects the next results.
 * Otherwise, creates a new search and selects the first
 * result.
 *
 * @memberof utils/source-search
 * @static
 */
function doSearch(
  ctx: $FixTypeLater,
  reverse: boolean,
  query: string,
  keepSelection: boolean,
  modifiers: SearchQueryModifiers,
  focusFirstResult: boolean = true
) {
  const { cm, ed } = ctx;
  if (!cm) {
    return;
  }
  const defaultIndex = { line: -1, ch: -1 };

  return cm.operation(function () {
    if (!query || isWhitespace(query)) {
      clearSearch(cm, query);
      return;
    }

    const state = getSearchState(cm);
    const isNewQuery = state.query !== query;
    state.query = query;

    updateOverlay(cm, state, query, modifiers);
    updateCursor(cm, state, keepSelection);
    const searchLocation = searchNext(ctx, reverse, query, isNewQuery, modifiers);

    // We don't want to jump the editor
    // when we're selecting text
    if (!cm.state.selectingText && searchLocation && focusFirstResult) {
      ed.alignLine(searchLocation.from!.line, "center");
      cm.setSelection(searchLocation.from, searchLocation.to);
    }

    return searchLocation ? searchLocation.from : defaultIndex;
  });
}

export function searchSourceForHighlight(
  ctx: $FixTypeLater,
  reverse: boolean,
  query: string,
  keepSelection: boolean,
  modifiers: SearchQueryModifiers,
  line: number,
  ch: number
) {
  const { cm } = ctx;
  if (!cm) {
    return;
  }

  return cm.operation(function () {
    const state = getSearchState(cm);
    const isNewQuery = state.query !== query;
    state.query = query;

    updateOverlay(cm, state, query, modifiers);
    updateCursor(cm, state, keepSelection);
    findNextOnLine(ctx, reverse, query, isNewQuery, modifiers, line, ch);
  });
}

function getCursorPos(newQuery: boolean, reverse: boolean, state: SearchStateType) {
  if (newQuery) {
    return reverse ? state.posFrom : state.posTo;
  }

  return reverse ? state.posTo : state.posFrom;
}

/**
 * Selects the next result of a saved search.
 *
 * @memberof utils/source-search
 * @static
 */
function searchNext(
  ctx: $FixTypeLater,
  reverse: boolean,
  query: string,
  newQuery: boolean,
  modifiers: SearchQueryModifiers
) {
  const { cm } = ctx;
  let nextMatch: { from: CharLocation | null; to: CharLocation | null } | undefined;
  cm.operation(function () {
    const state = getSearchState(cm);
    const pos = getCursorPos(newQuery, reverse, state);

    if (!state.query) {
      return;
    }

    let cursor = getSearchCursor(cm, state.query, pos, modifiers);

    const location = reverse ? { line: cm.lastLine(), ch: null } : { line: cm.firstLine(), ch: 0 };

    if (!cursor.find(reverse) && state.query) {
      cursor = getSearchCursor(cm, state.query, location as CharLocation, modifiers);
      if (!cursor.find(reverse)) {
        return;
      }
    }

    nextMatch = { from: cursor.from(), to: cursor.to() };
  });

  return nextMatch;
}

function findNextOnLine(
  ctx: $FixTypeLater,
  reverse: boolean,
  query: string,
  newQuery: boolean,
  modifiers: SearchQueryModifiers,
  line: number,
  ch: number
) {
  const { cm, ed } = ctx;
  cm.operation(function () {
    const pos = { line: line - 1, ch };
    let cursor = getSearchCursor(cm, query, pos, modifiers);

    if (!cursor.find(reverse) && query) {
      cursor = getSearchCursor(cm, query, pos, modifiers);
      if (!cursor.find(reverse)) {
        return;
      }
    }

    // We don't want to jump the editor
    // when we're selecting text
    if (!cm.state.selectingText) {
      ed.alignLine(cursor.from().line, "center");
      cm.setSelection(cursor.from(), cursor.to());
    }
  });
}

/**
 * Remove overlay.
 *
 * @memberof utils/source-search
 * @static
 */
export function removeOverlay(ctx: $FixTypeLater, query: string) {
  const state = getSearchState(ctx.cm);
  ctx.cm.removeOverlay(state.overlay);
  const { line, ch } = ctx.cm.getCursor();
  ctx.cm.doc.setSelection({ line, ch }, { line, ch }, { scroll: false });
}

/**
 * Clears the currently saved search.
 *
 * @memberof utils/source-search
 * @static
 */
export function clearSearch(cm: EditorWithDoc, query: string) {
  const state = getSearchState(cm);

  state.results = [];

  if (!state.query) {
    return;
  }
  cm.removeOverlay(state.overlay);
  state.query = null;
}

/**
 * Starts a new search.
 *
 * @memberof utils/source-search
 * @static
 */
export function find(
  ctx: $FixTypeLater,
  query: string,
  keepSelection: boolean,
  modifiers: SearchQueryModifiers,
  focusFirstResult: boolean
) {
  clearSearch(ctx.cm, query);
  return doSearch(ctx, false, query, keepSelection, modifiers, focusFirstResult);
}

/**
 * Finds the next item based on the currently saved search.
 *
 * @memberof utils/source-search
 * @static
 */
export function findNext(
  ctx: $FixTypeLater,
  query: string,
  keepSelection: boolean,
  modifiers: SearchQueryModifiers
) {
  return doSearch(ctx, false, query, keepSelection, modifiers);
}

/**
 * Finds the previous item based on the currently saved search.
 *
 * @memberof utils/source-search
 * @static
 */
export function findPrev(
  ctx: $FixTypeLater,
  query: string,
  keepSelection: boolean,
  modifiers: SearchQueryModifiers
) {
  return doSearch(ctx, true, query, keepSelection, modifiers);
}

export { buildQuery };
