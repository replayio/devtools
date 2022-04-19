/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// React & Redux
import React from "react";

// Constants
import ClearButton from "./ClearButton";
import { FilterDrawerToggle } from "./FilterDrawerToggle";
import FilterSearchBox from "./FilterSearchBox";

function FilterBar() {
  return (
    <div className={`webconsole-filteringbar-wrapper text-xs`} aria-live="off">
      <div className="devtools-toolbar devtools-input-toolbar webconsole-filterbar-primary space-x-2 px-2 py-1">
        <FilterDrawerToggle />
        <FilterSearchBox />
        <ClearButton />
      </div>
    </div>
  );
}

export default FilterBar;
