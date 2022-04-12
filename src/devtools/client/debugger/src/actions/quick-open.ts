/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { UIThunkAction } from "ui/actions";

import { loadGlobalFunctions } from "./ast";
import {
  openQuickOpen as openQuickOpenAction,
  setQuickOpenQuery,
  closeQuickOpen,
  getQuickOpenEnabled,
} from "../reducers/quick-open";
import { setViewMode } from "ui/actions/layout";
import { getViewMode } from "ui/reducers/layout";

// TODO This is a workaround solely to allow dispatching without errors.
// Additionally, the Redux team recommends against action type unions.
// This also is a somewhat loose type, because RTK only sees `type` as `string` rather than a literal constant.
export type QuickOpenActions = ReturnType<
  typeof openQuickOpenAction | typeof setQuickOpenQuery | typeof closeQuickOpen
>;

// Re-export for now to avoid altering other files
export { setQuickOpenQuery, closeQuickOpen };

export function openQuickOpen(query = "", project = false): UIThunkAction {
  return dispatch => {
    dispatch(loadGlobalFunctions());

    return dispatch(openQuickOpenAction({ query, project }));
  };
}

export function toggleQuickOpen(query = "", project = false): UIThunkAction {
  return (dispatch, getState) => {
    const quickOpenEnabled = getQuickOpenEnabled(getState());

    if (quickOpenEnabled) {
      dispatch(closeQuickOpen());
      return;
    }

    dispatch(openQuickOpen(query, project));
  };
}
