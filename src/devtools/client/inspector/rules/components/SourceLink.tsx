/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC } from "react";
import { SourceLink as SourceLinkType } from "../models/rule";

type SourceLinkProps = {
  id: string;
  isUserAgentStyle: boolean;
  sourceLink: SourceLinkType;
  type: number;
};

export const SourceLink: FC<SourceLinkProps> = ({ sourceLink: { label, title } }) => {
  return (
    <div className="ruleview-rule-source theme-link">
      <span className="ruleview-rule-source-label" title={title || undefined}>
        {label}
      </span>
    </div>
  );
};
