/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { EntityState, createAsyncThunk, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { SourceLocation } from "@replayio/protocol";

import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/sourceVisualizations";
import { MiniSource, SourceDetails, getSourceDetailsEntities } from "ui/reducers/sources";
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

type MemberDeclaration = SymbolDeclaration & {
  computed: Boolean;
  expression: string;
};

type IdentifierDeclaration = {
  name: string;
  location: AstLocation;
  expression: string;
};

type ImportDeclaration = {
  source: string;
  location: AstLocation;
  specifiers: string[];
};

export type SymbolDeclarations = {
  classes: ClassDeclaration[];
  functions: FunctionDeclaration[];
  memberExpressions: MemberDeclaration[];
  callExpressions: CallDeclaration[];
  objectProperties: IdentifierDeclaration[];
  identifiers: IdentifierDeclaration[];
  imports: ImportDeclaration[];
  comments: SymbolDeclaration[];
  literals: IdentifierDeclaration[];
  hasJsx: boolean;
  hasTypes: boolean;
  framework?: string;
  functionBodyLocations: SourceLocation[];
};

export interface SymbolEntry {
  id: string;
  symbols: SymbolDeclarations | null;
  status: LoadingStatus;
}

const symbolsAdapter = createEntityAdapter<SymbolEntry>();

export const { selectById: getSymbolEntryForSource } = symbolsAdapter.getSelectors(
  (state: UIState) => state.ast.symbols
);

export interface ASTState {
  /** A list of _all_ functions found anywhere in the sources.
   * Stored as pre-formatted search results used by the QuickOpenModal, and
   * fetched when the QOM is opened in "Project" mode with CTRL-O
   * */
  globalFunctions: SearchResult[] | null;
  globalFunctionsStatus: LoadingStatus;
  /** Symbol data parsed from a given source file locally by our Babel parser */
  symbols: EntityState<SymbolEntry>;
}

const initialState: ASTState = {
  symbols: symbolsAdapter.getInitialState(),
  globalFunctions: null,
  globalFunctionsStatus: LoadingStatus.IDLE,
};

export const fetchSymbolsForSource = createAsyncThunk<
  SymbolDeclarations,
  string,
  { state: UIState; extra: ThunkExtraArgs }
>(
  "ast/fetchSymbolsForSource",
  async sourceId => {
    const { parser } = await import("devtools/client/debugger/src/utils/bootstrap");

    const symbols = (await parser.getSymbols(sourceId)) as SymbolDeclarations;
    return symbols;
  },
  {
    condition(arg, thunkApi) {
      const entry = getSymbols(thunkApi.getState(), { id: arg });

      // TODO Hypothetically a race condition here if we're LOADING, as the thunk
      // will resolve now but the data isn't ready yet.
      // This is handled over in `syncBreakpoint`, since `selectLocation` is unlikely
      // to have that issue.
      // Note that switching to RTK Query should eliminate this, because its thunks
      // return promises that resolve once the data is actually available.
      const isPendingOrFulfilled =
        !!entry &&
        [LoadingStatus.LOADING, LoadingStatus.LOADED].includes(entry.status as LoadingStatus);
      return !isPendingOrFulfilled;
    },
    dispatchConditionRejection: false,
  }
);

export const fetchGlobalFunctions = createAsyncThunk<
  SearchResult[],
  void,
  { state: UIState; extra: ThunkExtraArgs }
>("ast/fetchGlobalFunctions", async (_, thunkApi) => {
  const { ThreadFront, replayClient } = thunkApi.extra;

  await ThreadFront.ensureAllSources();

  const sourceById = getSourceDetailsEntities(thunkApi.getState());
  // Empty query to grab all of the functions, which we can easily filter later.
  const query = "";
  const sourceIds = getSourceIDsToSearch(sourceById as Record<string, SourceDetails>);

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
      .addCase(fetchSymbolsForSource.pending, (state, action) => {
        symbolsAdapter.addOne(state.symbols, {
          id: action.meta.arg,
          symbols: null,
          status: LoadingStatus.LOADING,
        });
      })
      .addCase(fetchSymbolsForSource.fulfilled, (state, action) => {
        symbolsAdapter.updateOne(state.symbols, {
          id: action.meta.arg,
          changes: { symbols: action.payload, status: LoadingStatus.LOADED },
        });
      })
      .addCase(fetchGlobalFunctions.pending, state => {
        state.globalFunctionsStatus = LoadingStatus.LOADING;
      })
      .addCase(fetchGlobalFunctions.fulfilled, (state, action) => {
        state.globalFunctions = action.payload;
        state.globalFunctionsStatus = LoadingStatus.LOADED;
      });
  },
});

export function getSymbols(state: UIState, source?: MiniSource) {
  if (!source) {
    return null;
  }
  return getSymbolEntryForSource(state, source.id) || null;
}

export function isSymbolsLoading(state: UIState, source?: MiniSource) {
  const symbolsEntry = getSymbols(state, source);
  if (!symbolsEntry) {
    return false;
  }

  return symbolsEntry.status === LoadingStatus.LOADING;
}

export function isGlobalFunctionsLoading(state: UIState) {
  return state.ast.globalFunctionsStatus == LoadingStatus.LOADING;
}

export function getGlobalFunctions(state: UIState) {
  return state.ast.globalFunctions;
}

export default astSlice.reducer;
