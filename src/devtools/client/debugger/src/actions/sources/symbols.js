/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { selectors } from "ui/reducers";
import { PROMISE } from "../utils/middleware/promise";
import { loadSourceText, loadSource } from "./loadSourceText";

import { memoizeableAction } from "../../utils/memoizableAction";
import { fulfilled } from "../../utils/async-value";

async function doSetSymbols(source, { dispatch, parser }) {
  const sourceId = source.id;
  await dispatch(loadSourceText({ source }));

  await dispatch({
    type: "SET_SYMBOLS",
    sourceId,
    [PROMISE]: parser.getSymbols(sourceId),
  });
}

export const setSymbols = memoizeableAction("setSymbols", {
  getValue: ({ source }, { getState }) => {
    const symbols = selectors.getSymbols(getState(), source);
    if (!symbols || symbols.loading) {
      return null;
    }

    return fulfilled(symbols);
  },
  createKey: ({ source }) => source.id,
  action: ({ source }, thunkArgs) => doSetSymbols(source, thunkArgs),
});

export function loadSymbols() {
  return async ({ dispatch, getState, parser, client }) => {
    let loaded = 0;
    const getSymbolsSafely = async source => {
      try {
        await loadSource(getState(), source, { parser, client });

        const result = [source.url, await parser.getSymbols(source.id)];
        loaded++;
        return result;
      } catch (e) {
        loaded++;
        return [];
      }
    };

    if (selectors.getProjectSymbolsLoading(getState())) {
      return;
    }

    const sources = selectors.getSourceList(getState()).filter(source => source.url);

    const loadingInterval = setInterval(() => {
      const loading = { loaded, total: sources.length };
      dispatch({ type: "LOADING_SYMBOLS", loading });
    }, 1000);

    const symbols = Object.fromEntries(await Promise.all(sources.map(getSymbolsSafely)));
    clearInterval(loadingInterval);

    dispatch({
      type: "LOADED_SYMBOLS",
      symbols,
      loading: { loaded, total: sources.length },
    });
  };
}
