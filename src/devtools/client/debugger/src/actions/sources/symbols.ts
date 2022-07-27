/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { selectors } from "ui/reducers";
import type { AppDispatch } from "ui/setup/store";
import { PROMISE } from "ui/setup/redux/middleware/promise";
import { parser } from "devtools/client/debugger/src/utils/bootstrap";
import { experimentalLoadSourceText } from "ui/reducers/sources";
import type { SourceDetails } from "ui/reducers/sources";

import { memoizeableAction } from "../../utils/memoizableAction";
import { fulfilled } from "../../utils/async-value";

async function doSetSymbols(source: SourceDetails, thunkArgs: { dispatch: AppDispatch }) {
  const sourceId = source.id;
  await thunkArgs.dispatch(experimentalLoadSourceText(sourceId));

  await thunkArgs.dispatch({
    type: "SET_SYMBOLS",
    sourceId,
    [PROMISE]: parser.getSymbols(sourceId),
  });
}

export const setSymbols = memoizeableAction("setSymbols", {
  getValue: ({ source }, thunkArgs) => {
    const symbols = selectors.getSymbols(thunkArgs.getState(), source);
    if (!symbols || symbols.loading) {
      return null;
    }

    return fulfilled(symbols);
  },
  createKey: ({ source }: { source: SourceDetails }) => source.id,
  action: ({ source }, thunkArgs) => doSetSymbols(source, thunkArgs),
});
