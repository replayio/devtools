/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { UIThunkAction } from "ui/actions";

import {
  filterTextUpdated,
  filterToggled,
  getAllFilters,
  FilterBooleanFields,
} from "../reducers/filters";

const filterStateUpdated = (): UIThunkAction => (dispatch, getState) => {
  const newFiltersState = getAllFilters(getState());
  // TODO This only exists to work around an issue with the messages reducer seeing stale state
  // That was caused by moving calculation of toggled filter state into the reducer.
  // I plan to refactor the messages reducer to make "filtered messages" a derived value,
  // calculated by a Reselect selector. At that time this can go away.
  dispatch({ type: "FILTER_STATE_UPDATED", filtersState: newFiltersState });
};

export const filterTextSet = (text: string): UIThunkAction => {
  return (dispatch, getState) => {
    dispatch(filterTextUpdated(text));

    // Force a recalculation of updated messages
    dispatch(filterStateUpdated());
  };
};

export function filterToggle(filter: FilterBooleanFields): UIThunkAction {
  return (dispatch, getState) => {
    // Actually toggle the state
    dispatch(filterToggled(filter));

    // Force a recalculation of updated messages
    dispatch(filterStateUpdated());
  };
}
