import React, { FC } from "react";
import { Declarations } from "devtools/client/inspector/rules/components/Declarations";
import { RuleState } from "../state/rules";
import Selector from "devtools/client/inspector/rules/components/Selector";
import { SourceLink } from "devtools/client/inspector/rules/components/SourceLink";

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
      className={
        "ruleview-rule devtools-monospace" +
        (isUnmatched ? " unmatched" : "") +
        (isUserAgentStyle ? " uneditable" : "")
      }
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
          <Selector {...{ id, isUserAgentStyle, selector, showSelectorEditor, type, query }} />
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
