import classNames from "classnames";
import { Declarations } from "devtools/client/inspector/rules/components/Declarations";
import Selector from "devtools/client/inspector/rules/components/Selector";
import { SourceLink } from "devtools/client/inspector/rules/components/SourceLink";
import React, { FC } from "react";

import { RuleState } from "../state/rules";

type RuleProps = {
  showSelectorEditor: Function;
  query: string;
  rule: RuleState;
};

export const Rule: FC<RuleProps> = ({
  showSelectorEditor,
  query,
  rule: { id, declarations, sourceLink, selector, type, isUserAgentStyle, isUnmatched },
}) => {
  return (
    <div
      className={classNames("ruleview-rule devtools-monospace", {
        uneditable: isUserAgentStyle,
        unmatched: isUnmatched,
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
          <Selector {...{ id, isUserAgentStyle, query, selector, showSelectorEditor, type }} />
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
