/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import classnames from "classnames";

const LONG_TEXT_ROTATE_LIMIT = 3;

interface BMEProps {
  box: string;
  direction?: string;
  property: string;
  textContent: string | number;
}

export function BoxModelSideLabel({ box, direction, property, textContent }: BMEProps) {
  const rotate =
    direction &&
    (direction == "left" || direction == "right") &&
    box !== "position" &&
    textContent.toString().length > LONG_TEXT_ROTATE_LIMIT;

  const paraClassnames = classnames(
    `boxmodel-${box}`,
    direction ? `boxmodel-${direction}` : `boxmodel-${property}`,
    rotate ? "boxmodel-rotate" : ""
  );

  return (
    <p className={paraClassnames}>
      <span className="boxmodel-editable" data-box={box} title={property}>
        {textContent}{" "}
      </span>
    </p>
  );
}
