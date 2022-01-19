/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import classnames from "classnames";
import React from "react";
import AccessibleImage from "../AccessibleImage";

export default function CommandBarButton({ disabled, disabledTooltip, onClick, tooltip, type }) {
  return (
    <button
      className={classnames("command-bar-button")}
      title={disabled ? disabledTooltip : tooltip}
      onClick={onClick}
      disabled={disabled}
    >
      <AccessibleImage className={type} />
    </button>
  );
}
