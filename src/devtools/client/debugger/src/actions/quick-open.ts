/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { UIThunkAction } from "ui/actions";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { fetchGlobalFunctions } from "../reducers/ast";
import {
  closeQuickOpen,
  getQuickOpenEnabled,
  openQuickOpen as openQuickOpenAction,
  setQuickOpenQuery,
} from "../reducers/quick-open";

// TODO This is a workaround solely to allow dispatching without errors.
// Additionally, the Redux team recommends against action type unions.
// This also is a somewhat loose type, because RTK only sees `type` as `string` rather than a literal constant.
export type QuickOpenActions = ReturnType<
  typeof openQuickOpenAction | typeof setQuickOpenQuery | typeof closeQuickOpen
>;

// Re-export for now to avoid altering other files
export { setQuickOpenQuery, closeQuickOpen };

export function openQuickOpen(
  query = "",
  project = false,
  showOnlyOpenSources = false
): UIThunkAction {
  return dispatch => {
    if (project) {
      dispatch(fetchGlobalFunctions());
    }

    return dispatch(openQuickOpenAction({ query, project, showOnlyOpenSources }));
  };
}

export function toggleQuickOpen(
  query = "",
  project = false,
  showOnlyOpenSources = false,
  dismissUseFocusModeNag: () => void
): UIThunkAction {
  return (dispatch, getState) => {
    const quickOpenEnabled = getQuickOpenEnabled(getState());
    const [, dismissUseFocusModeNag] = useNag(Nag.USE_FOCUS_MODE);
    console.log("YARRRRRR");
    dismissUseFocusModeNag();

    if (quickOpenEnabled) {
      dispatch(closeQuickOpen());
      return;
    }

    dispatch(openQuickOpen(query, project, showOnlyOpenSources));
  };
}
