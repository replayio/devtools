/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { UIThunkAction } from "ui/actions";
import { SourceActor } from "../reducers/source-actors";

export function insertSourceActor(item: SourceActor) {
  return insertSourceActors([item]);
}
export function insertSourceActors(items: SourceActor[]): UIThunkAction {
  return function (dispatch) {
    dispatch({
      type: "INSERT_SOURCE_ACTORS",
      items,
    });
  };
}

export function removeSourceActor(item: SourceActor) {
  return removeSourceActors([item]);
}
export function removeSourceActors(items: SourceActor[]): UIThunkAction {
  return function (dispatch) {
    dispatch({ type: "REMOVE_SOURCE_ACTORS", items });
  };
}
