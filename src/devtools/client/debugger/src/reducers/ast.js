/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

export function initialASTState() {
  return {
    symbols: {},
    projectSymbolsLoading: null,
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

    case "LOADING_SYMBOLS": {
      return { ...state, projectSymbolsLoading: action.loading, symbols: action.symbols };
    }

    case "LOADED_SYMBOLS": {
      return {
        ...state,
        symbols: { ...state.symbols, ...action.symbols },
        projectSymbolsLoading: action.loading,
      };
    }

    case "RESUME": {
      return { ...state };
    }

    case "NAVIGATE": {
      return initialASTState();
    }

    case "BATCH":
      action.updates.forEach(u => (state = update(state, u)));
      return state;

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

export function getProjectSymbols(state) {
  return state.ast.symbols;
}

export function hasSymbols(state, source) {
  const symbols = getSymbols(state, source);

  if (!symbols) {
    return false;
  }

  return !symbols.loading;
}

export function getProjectSymbolsLoading(state) {
  return state.ast.projectSymbolsLoading;
}

export function isSymbolsLoading(state, source) {
  const symbols = getSymbols(state, source);
  if (!symbols) {
    return false;
  }

  return symbols.loading;
}

export default update;
