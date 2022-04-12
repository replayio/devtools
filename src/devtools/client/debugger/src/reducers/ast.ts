/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction } from "@reduxjs/toolkit";

import { UIState } from "ui/state";

type AstPosition = { line: number; column: number };
type AstLocation = { end: AstPosition; start: AstPosition };

type SymbolDeclaration = {
  name: string;
  location: AstLocation;
  generatedLocation?: AstPosition;
};

type ClassDeclaration = SymbolDeclaration & {
  parent?: {
    name: string;
    location: AstLocation;
  };
};

type FunctionDeclaration = SymbolDeclaration & {
  parameterNames: string[];
  klass: string | null;
  identifier: Object;
  index: number;
};

type CallDeclaration = SymbolDeclaration & {
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

type SymbolDeclarations = {
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
  loading: false;
};

type Symbol = { loading: boolean } | SymbolDeclarations;

export interface ASTState {
  globalFunctions: unknown[] | null;
  loadingGlobalFunctions: boolean;
  // dead
  projectSymbolsLoading: null;
  symbols: Record<string, Symbol>;
}

export function initialASTState(): ASTState {
  return {
    symbols: {},
    projectSymbolsLoading: null,
    globalFunctions: null,
    loadingGlobalFunctions: false,
  };
}

function update(state = initialASTState(), action: AnyAction) {
  switch (action.type) {
    case "SET_SYMBOLS": {
      const { sourceId } = action;
      if (action.status === "start") {
        return {
          ...state,
          symbols: { ...state.symbols, [sourceId]: { loading: true } },
        };
      }

      const value = action.value;
      return {
        ...state,
        symbols: { ...state.symbols, [sourceId]: value },
      };
    }

    case "LOADING_GLOBAL_FUNCTIONS": {
      return {
        ...state,
        loadingGlobalFunctions: true,
      };
    }

    case "SET_GLOBAL_FUNCTIONS": {
      return {
        ...state,
        loadingGlobalFunctions: false,
        globalFunctions: action.globalFns,
      };
    }

    case "RESUME": {
      return { ...state };
    }

    default: {
      return state;
    }
  }
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185

interface PartialSource {
  id: string;
}

export function getSymbols(state: UIState, source?: PartialSource) {
  if (!source) {
    return null;
  }

  return state.ast.symbols[source.id] || null;
}

export function hasSymbols(state: UIState, source?: PartialSource) {
  const symbols = getSymbols(state, source);

  if (!symbols) {
    return false;
  }

  return !symbols.loading;
}

export function isSymbolsLoading(state: UIState, source?: PartialSource) {
  const symbols = getSymbols(state, source);
  if (!symbols) {
    return false;
  }

  return symbols.loading;
}

export function isGlobalFunctionsLoading(state: UIState) {
  return state.ast.loadingGlobalFunctions;
}

export function getGlobalFunctions(state: UIState) {
  return state.ast.globalFunctions;
}

export default update;
