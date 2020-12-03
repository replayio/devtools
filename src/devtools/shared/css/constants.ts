/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * All CSS <angle> types that properties can support.
 */
export const CSS_ANGLEUNIT = {
  deg: "deg",
  rad: "rad",
  grad: "grad",
  turn: "turn",
};

/**
 * Mapping of InspectorPropertyType to old type ID.
 * Kept for backwards compatibility. Remove after Firefox 70.
 */
export const CSS_TYPES = {
  color: 2,
  gradient: 4,
  "timing-function": 10,
};

/**
 * Supported pseudo-class locks in the order in which they appear in the pseudo-class
 * panel in the Rules sidebar panel of the Inspector.
 */
export type PseudoClass = ":hover" | ":active" | ":focus" | ":focus-within" | ":visited";
export const PSEUDO_CLASSES: PseudoClass[] = [
  ":hover",
  ":active",
  ":focus",
  ":focus-within",
  ":visited",
];
