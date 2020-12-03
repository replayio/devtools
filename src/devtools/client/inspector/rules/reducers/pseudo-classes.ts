/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PSEUDO_CLASSES } from "devtools/shared/css/constants";
import { createReducer, ReducerObject } from "../../shared/reducer-object";
import { PseudoClassesAction } from "../actions/pseudo-classes";
import { PseudoClassesState } from "../state/pseudo-classes";

const INITIAL_PSEUDO_CLASSES = PSEUDO_CLASSES.reduce<Partial<PseudoClassesState>>(
  (accumulator, pseudoClass) => {
    accumulator[pseudoClass] = {
      isChecked: false,
      isDisabled: false,
    };
    return accumulator;
  },
  {}
) as PseudoClassesState;

const reducers: ReducerObject<PseudoClassesState, PseudoClassesAction> = {
  ["DISABLE_ALL_PSEUDO_CLASSES"]() {
    return PSEUDO_CLASSES.reduce<Partial<PseudoClassesState>>((accumulator, pseudoClass) => {
      accumulator[pseudoClass] = {
        isChecked: false,
        isDisabled: true,
      };
      return accumulator;
    }, {}) as PseudoClassesState;
  },

  ["SET_PSEUDO_CLASSES"](_, { pseudoClassLocks }) {
    return PSEUDO_CLASSES.reduce<Partial<PseudoClassesState>>((accumulator, pseudoClass) => {
      accumulator[pseudoClass] = {
        isChecked: pseudoClassLocks.includes(pseudoClass),
        isDisabled: false,
      };
      return accumulator;
    }, {}) as PseudoClassesState;
  },

  ["TOGGLE_PSEUDO_CLASS"](pseudoClasses, { pseudoClass }) {
    return {
      ...pseudoClasses,
      [pseudoClass]: {
        ...pseudoClasses[pseudoClass],
        isChecked: !pseudoClasses[pseudoClass].isChecked,
      },
    };
  },
};

export default createReducer(INITIAL_PSEUDO_CLASSES, reducers);
