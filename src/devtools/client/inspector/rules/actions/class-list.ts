/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Action } from "redux";
import { ClassInfo } from "../models/class-list";

type UpdateClassesAction = Action<"UPDATE_CLASSES"> & { classes: ClassInfo[] };
type UpdateClassPanelExpandedAction = Action<"UPDATE_CLASS_PANEL_EXPANDED"> & {
  isClassPanelExpanded: boolean;
};
export type ClassListAction = UpdateClassesAction | UpdateClassPanelExpandedAction;

/**
 * Updates the entire class list state with the new list of classes.
 *
 * @param  {Array<Object>} classes
 *         Array of CSS classes object applied to the element.
 */
export function updateClasses(classes: ClassInfo[]) {
  return {
    type: "UPDATE_CLASSES",
    classes,
  };
}

/**
 * Updates whether or not the class list panel is expanded.
 *
 * @param  {Boolean} isClassPanelExpanded
 *         Whether or not the class list panel is expanded.
 */
export function updateClassPanelExpanded(isClassPanelExpanded: boolean) {
  return {
    type: "UPDATE_CLASS_PANEL_EXPANDED",
    isClassPanelExpanded,
  };
}
