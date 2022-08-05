/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";

interface CPProps {
  name: string;
  value: string;
}

export function ComputedProperty({ name, value }: CPProps) {
  return (
    <div className="computed-property-view" data-property-name={name} tabIndex={0}>
      <div className="computed-property-name-container">
        <div className="computed-property-name theme-fg-color3" title={name}>
          {name}
        </div>
      </div>
      <div className="computed-property-value-container">
        <div className="computed-property-value theme-fg-color1" dir="ltr">
          {value}
        </div>
      </div>
    </div>
  );
}
