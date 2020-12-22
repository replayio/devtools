/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React from "react";
import classnames from "classnames";
import "./styles/PaneToggleButton.css";

export default function PaneToggleButton({ collapsed, handleClick }) {
  const title = collapsed ? "Expand the sidebar" : "Collapse the sidebar";

  return (
    <button
      className={classnames("toggle-button", {
        collapsed,
      })}
      onClick={handleClick}
      title={title}
    >
      <div className="img chevron-double-left" />
    </button>
  );
}
