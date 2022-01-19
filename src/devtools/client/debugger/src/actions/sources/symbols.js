/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { selectors } from "ui/reducers";
import { PROMISE } from "ui/setup/redux/middleware/promise";
import { loadSourceText } from "./loadSourceText";

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
