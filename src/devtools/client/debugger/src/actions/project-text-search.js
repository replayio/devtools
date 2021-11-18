/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Redux actions for the search state
 * @module actions/search
 */

import { isFulfilled } from "../utils/async-value";
import { findSourceMatches } from "../workers/search";
import { getSource, getSourceContent } from "../selectors";
import {
  statusType,
  getTextSearchOperation,
  getTextSearchStatus,
} from "../reducers/project-text-search";
import { ThreadFront } from "protocol/thread";
import { groupBy } from "lodash";

const mapSearchResultMatches = (matches, source) => {
  return {
    sourceId: source.id,
    filepath: source?.url,
    matches: matches.map(match => {
      const matchStr = [...match.context]
        .slice(match.contextStart.column, match.contextEnd.column)
        .join("");
      return {
        column: match.location.column,
        line: match.location.line,
        sourceId: source.id,
        match: matchStr,
        matchIndex: match.context.indexOf(matchStr),
        value: match.context,
      };
    }),
  };
};

export function addSearchQuery(cx, query) {
  return { type: "ADD_QUERY", cx, query };
}

export function addOngoingSearch(cx, ongoingSearch) {
  return { type: "ADD_ONGOING_SEARCH", cx, ongoingSearch };
}

export function addSearchResult(cx, sourceId, filepath, matches) {
  return {
    type: "ADD_SEARCH_RESULT",
    cx,
    result: { sourceId, filepath, matches },
  };
}

export function addSearchResults(cx, results) {
  return {
    type: "ADD_SEARCH_RESULTS",
    cx,
    results,
  };
}

export function clearSearchResults(cx) {
  return { type: "CLEAR_SEARCH_RESULTS", cx };
}

export function clearSearch(cx) {
  return { type: "CLEAR_SEARCH", cx };
}

export function updateSearchStatus(cx, status) {
  return { type: "UPDATE_STATUS", cx, status };
}

export function closeProjectSearch(cx) {
  return ({ dispatch, getState }) => {
    dispatch(stopOngoingSearch(cx));
    dispatch({ type: "CLOSE_PROJECT_SEARCH" });
  };
}

export function stopOngoingSearch(cx) {
  return ({ dispatch, getState }) => {
    const state = getState();
    const ongoingSearch = getTextSearchOperation(state);
    const status = getTextSearchStatus(state);
    if (ongoingSearch && status !== statusType.done) {
      ongoingSearch.cancel();
      dispatch(updateSearchStatus(cx, statusType.cancelled));
    }
  };
}

export function searchSources(cx, query) {
  let cancelled = false;

  const search = async ({ dispatch, getState }) => {
    dispatch(stopOngoingSearch(cx));
    await dispatch(addOngoingSearch(cx, search));
    await dispatch(clearSearchResults(cx));
    await dispatch(addSearchQuery(cx, query));
    dispatch(updateSearchStatus(cx, statusType.fetching));
    await ThreadFront.searchSources({ query }, matches => {
      const bestResults = matches.filter(
        match => !ThreadFront.isMinifiedSource(match.location.sourceId)
      );
      const resultsBySource = groupBy(bestResults, res => res.location.sourceId);
      const results = Object.entries(resultsBySource).map(([sourceId, matches]) =>
        mapSearchResultMatches(matches, getSource(getState(), sourceId))
      );
      dispatch(addSearchResults(cx, results));
    });
    dispatch(updateSearchStatus(cx, statusType.done));
  };

  search.cancel = () => {
    cancelled = true;
  };

  return search;
}

export function searchSource(cx, sourceId, query) {
  return async ({ dispatch, getState }) => {
    const source = getSource(getState(), sourceId);
    if (!source) {
      return;
    }

    const content = getSourceContent(getState(), source.id);
    let matches = [];
    if (content && isFulfilled(content) && content.value.type === "text") {
      matches = await findSourceMatches(source.id, content.value, query);
    }
    if (!matches.length) {
      return;
    }
    dispatch(addSearchResult(cx, source.id, source.url, matches));
  };
}
