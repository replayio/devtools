import classNames from "classnames";
import { Declarations } from "devtools/client/inspector/rules/components/Declarations";
import Selector from "devtools/client/inspector/rules/components/Selector";
import { SourceLink } from "devtools/client/inspector/rules/components/SourceLink";
import React, { FC } from "react";

import { RuleState } from "../reducers/rules";

type RuleProps = {
  query: string;
  rule: RuleState;
};

export const Rule: FC<RuleProps> = ({
  query,
  rule: { id, declarations, sourceLink, selector, type, isUserAgentStyle, isUnmatched },
}) => {
  return (
    <div
      className={classNames("ruleview-rule devtools-monospace", {
        unmatched: isUnmatched,
        uneditable: isUserAgentStyle,
      })}
      data-rule-id={id}
    >
      <SourceLink
        id={id}
        isUserAgentStyle={isUserAgentStyle ?? false}
        sourceLink={sourceLink}
        type={type}
      />
      <div className="ruleview-code">
        <div>
          <Selector {...{ id, isUserAgentStyle, selector, type, query }} />
          <span className="ruleview-ruleopen">{" {"}</span>
        </div>
        <Declarations declarations={declarations} query={query} />
        <div className="ruleview-ruleclose" tabIndex={!isUserAgentStyle ? 0 : -1}>
          {"}"}
        </div>
      </div>
    </div>
  );
};
