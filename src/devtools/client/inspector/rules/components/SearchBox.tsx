/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React, { FC } from "react";

const { getStr } = require("devtools/client/inspector/rules/utils/l10n");

export const SearchBox: FC = () => {
  return (
    <div className="devtools-searchbox">
      <input
        id="ruleview-searchbox"
        type="text"
        autoComplete="off"
        className="devtools-filterinput"
        placeholder={getStr("rule.filterStyles.placeholder")}
      />
    </div>
  );
};
