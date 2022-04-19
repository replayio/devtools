/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { selectors } from "ui/reducers";
import { PROMISE } from "ui/setup/redux/middleware/promise";

import { fulfilled } from "../../utils/async-value";
import { memoizeableAction } from "../../utils/memoizableAction";

import { loadSourceText } from "./loadSourceText";

async function doSetSymbols(source, thunkArgs) {
  const sourceId = source.id;
  await thunkArgs.dispatch(loadSourceText({ source }));

  await thunkArgs.dispatch({
    [PROMISE]: parser.getSymbols(sourceId),
    sourceId,
    type: "SET_SYMBOLS",
  });
}

export const setSymbols = memoizeableAction("setSymbols", {
  action: ({ source }, thunkArgs) => doSetSymbols(source, thunkArgs),
  createKey: ({ source }) => source.id,
  getValue: ({ source }, thunkArgs) => {
    const symbols = selectors.getSymbols(thunkArgs.getState(), source);
    if (!symbols || symbols.loading) {
      return null;
    }

    return fulfilled(symbols);
  },
});
