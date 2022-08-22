/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { useRef, useReducer, useContext } from "react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import Checkbox from "ui/components/shared/Forms/Checkbox";
import { trackEvent } from "ui/utils/telemetry";

import { useAppSelector, useAppDispatch } from "ui/setup/hooks";

import { getSourceDetailsEntities, SourceDetails } from "ui/reducers/sources";
import { selectSpecificLocation } from "devtools/client/debugger/src/actions/sources";
import { doSearchForHighlight } from "devtools/client/debugger/src/actions/file-search";
import { focusFullTextInput } from "devtools/client/debugger/src/reducers/ui";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getContext, getFullTextSearchFocus } from "../../selectors";

import { getEditor } from "../../utils/editor";

import { FullTextFilter } from "./FullTextFilter";
import { FullTextResults } from "./FullTextResults";
import { search, SourceResultEntry, SourceMatchEntry } from "./search";

function sanitizeQuery(query: string) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

export interface FTSState {
  focusedItem: SourceResultEntry | SourceMatchEntry | null;
  query: string;
  results: {
    status: "DONE" | "LOADING";
    matchesBySource: SourceResultEntry[];
  };
  includeNodeModules: boolean;
}

const initialState: FTSState = {
  focusedItem: null,
  query: "",
  results: {
    status: "DONE" as const,
    matchesBySource: [],
  },
  includeNodeModules: true,
};

// Reducer for use in the `<FullTextSearch>` component,
// mostly to avoid having to pass around existing matches
// in order to concatenate them together
const ftsSlice = createSlice({
  name: "fts",
  initialState,
  reducers: {
    itemFocused(state, action: PayloadAction<SourceResultEntry | SourceMatchEntry | null>) {
      state.focusedItem = action.payload;
    },
    queryUpdated(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    searchStarted(state) {
      state.results.status = "LOADING";
      state.results.matchesBySource = [];
    },
    searchResultsReceived(state, action: PayloadAction<SourceResultEntry[]>) {
      state.results.matchesBySource.push(...action.payload);
    },
    searchCompleted(state) {
      state.results.status = "DONE";
    },
    nodeModulesToggled(state) {
      state.includeNodeModules = !state.includeNodeModules;
    },
  },
});

const {
  itemFocused,
  nodeModulesToggled,
  searchStarted,
  searchResultsReceived,
  searchCompleted,
  queryUpdated,
} = ftsSlice.actions;

function FullTextSearch() {
  const [state, localDispatch] = useReducer(ftsSlice.reducer, initialState);
  const replayClient = useContext(ReplayClientContext);
  const { includeNodeModules, query, results, focusedItem } = state;

  const searchRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();

  const cx = useAppSelector(getContext);
  const sourcesById = useAppSelector(getSourceDetailsEntities);
  const focused = useAppSelector(getFullTextSearchFocus);

  const selectMatchItem = (matchItem: SourceMatchEntry) => {
    trackEvent("project_search.select");

    dispatch(
      selectSpecificLocation(cx, {
        sourceId: matchItem.sourceId,
        line: matchItem.line,
        column: matchItem.column,
      })
    );

    setTimeout(
      () => dispatch(doSearchForHighlight(query, getEditor(), matchItem.line, matchItem.column)),
      20
    );
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      trackEvent("project_search.go_to_first_result");
      searchRef.current!.querySelector<HTMLElement>(".file-result:first-child")!.focus();
      e.preventDefault();
      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    // @ts-expect-error e.target.value doesn't exist
    const sanitizedQuery = sanitizeQuery(e.target.value);

    localDispatch(itemFocused(null));

    if (sanitizedQuery && sanitizedQuery.length >= 3) {
      localDispatch(searchStarted());
      try {
        const loadResults = (newResults: SourceResultEntry[]) => {
          localDispatch(searchResultsReceived(newResults));
        };
        await search(
          sanitizedQuery,
          sourcesById as Record<string, SourceDetails>,
          loadResults,
          includeNodeModules,
          replayClient
        );
      } finally {
        localDispatch(searchCompleted);
      }
    }
  };

  const onFocus = (item: SourceResultEntry | SourceMatchEntry) => {
    if (focusedItem !== item) {
      localDispatch(itemFocused(item));
    }

    if (item?.type === "MATCH") {
      selectMatchItem(item);
    }
  };

  return (
    <div ref={searchRef} className="search-container">
      <div className="project-text-search">
        <div className="header">
          <FullTextFilter
            value={query}
            focused={focused}
            setValue={(value: string) => localDispatch(queryUpdated(value))}
            results={results}
            onKeyDown={onKeyDown}
            focusFullTextInput={focusFullTextInput}
          />
        </div>
        <label className="select-none space-x-2 p-2" htmlFor="node-modules">
          <Checkbox
            id="node-modules"
            checked={includeNodeModules}
            onChange={() => localDispatch(nodeModulesToggled())}
          />
          <span>Include node modules</span>
        </label>
        <FullTextResults
          onItemSelect={selectMatchItem}
          focusedItem={focusedItem}
          onFocus={onFocus}
          results={results}
          query={query}
        />
      </div>
    </div>
  );
}

export default FullTextSearch;
