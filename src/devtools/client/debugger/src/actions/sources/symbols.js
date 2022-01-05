/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { selectors } from "ui/reducers";
import { PROMISE } from "ui/setup/redux/middleware/promise";
import { loadSourceText } from "./loadSourceText";

import { memoizeableAction } from "../../utils/memoizableAction";
import { fulfilled } from "../../utils/async-value";
import { ThreadFront } from "protocol/thread";
import { getSourceIDsToSearch } from "devtools/client/debugger/src/utils/source";
import { formatProjectFunctions } from "../../utils/quick-open";
import {
  getGlobalFunctions,
  isGlobalFunctionsLoading,
} from "devtools/client/debugger/src/reducers/ast";

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

export function loadGlobalFunctions() {
  return async ({ dispatch, getState }) => {
    // Only load global functions once.
    if (getGlobalFunctions(getState()) !== null || isGlobalFunctionsLoading(getState())) {
      return;
    }

    dispatch({
      type: "LOADING_GLOBAL_FUNCTIONS",
    });

    await ThreadFront.ensureAllSources();

    const sourceById = selectors.getSources(getState()).values;
    // Empty query to grab all of the functions, which we can easily filter later.
    const query = "";
    const sourceIds = getSourceIDsToSearch(sourceById);

    const globalFns = [];

    await ThreadFront.searchFunctions({ query, sourceIds }, matches => {
      globalFns.push(...formatProjectFunctions(matches, sourceById));
    });

    dispatch({
      type: "SET_GLOBAL_FUNCTIONS",
      globalFns,
    });
  };
}
