/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

export function initialASTState() {
  return {
    symbols: {},
    projectSymbolsLoading: null,
    globalFunctions: null,
    loadingGlobalFunctions: false,
  };
}

function update(state = initialASTState(), action) {
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

export function getSymbols(state, source) {
  if (!source) {
    return null;
  }

  return state.ast.symbols[source.id] || null;
}

export function hasSymbols(state, source) {
  const symbols = getSymbols(state, source);

  if (!symbols) {
    return false;
  }

  return !symbols.loading;
}

export function isSymbolsLoading(state, source) {
  const symbols = getSymbols(state, source);
  if (!symbols) {
    return false;
  }

  return symbols.loading;
}

export function isGlobalFunctionsLoading(state) {
  return state.ast.loadingGlobalFunctions;
}

export function getGlobalFunctions(state) {
  return state.ast.globalFunctions;
}

export default update;
