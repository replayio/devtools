/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classNames from "classnames";
import React from "react";

export type BracketArrowOrientation = "up" | "down" | "left" | "right";
export interface BAProps {
  orientation?: BracketArrowOrientation;
  left?: number;
  top?: number;
  bottom?: number;
}

const BracketArrow = ({ orientation, left, top, bottom }: BAProps) => {
  return (
    <div
      className={classNames("bracket-arrow", orientation || "up")}
      style={{ left, top, bottom }}
    />
  );
};

export default BracketArrow;
