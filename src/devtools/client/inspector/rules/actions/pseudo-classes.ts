/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PseudoClass } from "devtools/shared/css/constants";
import { Action } from "redux";

type DisableAllPseudoClassesAction = Action<"DISABLE_ALL_PSEUDO_CLASSES">;
type SetPseudoClassLocksAction = Action<"SET_PSEUDO_CLASSES"> & { pseudoClassLocks: string[] };
type TogglePseudoClassAction = Action<"TOGGLE_PSEUDO_CLASS"> & { pseudoClass: PseudoClass };
export type PseudoClassesAction =
  | DisableAllPseudoClassesAction
  | SetPseudoClassLocksAction
  | TogglePseudoClassAction;

/**
 * Disables all the pseudo class checkboxes because the current selection is not an
 * element node.
 */
export function disableAllPseudoClasses(): DisableAllPseudoClassesAction {
  return {
    type: "DISABLE_ALL_PSEUDO_CLASSES",
  };
}

/**
 * Sets the entire pseudo class state with the new list of applied pseudo-class
 * locks.
 *
 * @param  {Array<String>} pseudoClassLocks
 *         Array of all pseudo class locks applied to the current selected element.
 */
export function setPseudoClassLocks(pseudoClassLocks: string[]): SetPseudoClassLocksAction {
  return {
    type: "SET_PSEUDO_CLASSES",
    pseudoClassLocks,
  };
}

/**
 * Toggles on or off the given pseudo class value for the current selected element.
 *
 * @param  {String} pseudoClass
 *         The pseudo class value to toggle on or off.
 */
export function togglePseudoClass(pseudoClass: PseudoClass): TogglePseudoClassAction {
  return {
    type: "TOGGLE_PSEUDO_CLASS",
    pseudoClass,
  };
}
