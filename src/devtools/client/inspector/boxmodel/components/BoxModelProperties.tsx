/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React, { useState } from "react";

import type { Layout } from "ui/suspense/styleCaches";

import { ComputedProperty } from "./ComputedProperty";

interface BMProps {
  layout: Layout;
}

const layoutInfo = [
  "box-sizing",
  "display",
  "float",
  "line-height",
  "position",
  "z-index",
] as const;

export function BoxModelProperties({ layout }: BMProps) {
  const [isOpen, setIsOpen] = useState(true);

  const onToggleExpander = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const properties = layoutInfo.map(info => {
    return <ComputedProperty key={info} name={info} value={layout[info]} />;
  });

  return (
    <div className="layout-properties">
      <div className="layout-properties-header" onDoubleClick={onToggleExpander}>
        <span
          className="layout-properties-expander theme-twisty"
          onClick={onToggleExpander}
          style={{ transform: isOpen ? "none" : undefined }}
        ></span>
        Box Model Properties
      </div>
      <div className="layout-properties-wrapper devtools-monospace" hidden={!isOpen} tabIndex={0}>
        {properties}
      </div>
    </div>
  );
}
