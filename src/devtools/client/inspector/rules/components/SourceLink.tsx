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
