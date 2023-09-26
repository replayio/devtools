/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/sourceVisualizations";
import { sourcesByIdCache, sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { UIState } from "ui/state";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import { ThunkExtraArgs } from "ui/utils/thunk";

import { SearchResult, formatProjectFunctions } from "../utils/quick-open";

export type AstPosition = { line: number; column: number };
export type AstLocation = { end: AstPosition; start: AstPosition };

type SymbolDeclaration = {
  name: string;
  location: AstLocation;
  generatedLocation?: AstPosition;
};

export type ClassDeclaration = SymbolDeclaration & {
  parent?: {
    name: string;
    location: AstLocation;
  };
};

export type FunctionDeclaration = SymbolDeclaration & {
  parameterNames: string[];
  klass: string | null;
  identifier: Object;
  index: number;
};

export type CallDeclaration = SymbolDeclaration & {
  values: string[];
};

export interface ASTState {
  /** A list of _all_ functions found anywhere in the sources.
   * Stored as pre-formatted search results used by the QuickOpenModal, and
   * fetched when the QOM is opened in "Project" mode with CTRL-O
   * */
  globalFunctions: SearchResult[] | null;
  globalFunctionsStatus: LoadingStatus;
}

const initialState: ASTState = {
  globalFunctions: null,
  globalFunctionsStatus: LoadingStatus.IDLE,
};

export const fetchGlobalFunctions = createAsyncThunk<
  SearchResult[],
  void,
  { state: UIState; extra: ThunkExtraArgs }
>("ast/fetchGlobalFunctions", async (_, thunkApi) => {
  const { replayClient } = thunkApi.extra;

  await sourcesCache.readAsync(replayClient);

  const sourceById = await sourcesByIdCache.readAsync(replayClient);
  // Empty query to grab all of the functions, which we can easily filter later.
  const query = "";
  const sourceIds = getSourceIDsToSearch(sourceById);

  const globalFns: SearchResult[] = [];

  await replayClient.searchFunctions({ query, sourceIds }, matches => {
    globalFns.push(...formatProjectFunctions(matches, sourceById));
  });

  return globalFns;
});

const astSlice = createSlice({
  name: "ast",
  initialState,
  // Could actually be a `createReducer` but oh well
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchGlobalFunctions.pending, state => {
        state.globalFunctionsStatus = LoadingStatus.LOADING;
      })
      .addCase(fetchGlobalFunctions.fulfilled, (state, action) => {
        state.globalFunctions = action.payload;
        state.globalFunctionsStatus = LoadingStatus.LOADED;
      });
  },
});

export function isGlobalFunctionsLoading(state: UIState) {
  return state.ast.globalFunctionsStatus == LoadingStatus.LOADING;
}

export function getGlobalFunctions(state: UIState) {
  return state.ast.globalFunctions;
}

export default astSlice.reducer;
