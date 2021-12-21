import React, { FC } from "react";
import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { RuleState } from "../state/rules";

type RulesProps = {
  rules: RuleState[];
  onToggleDeclaration: Function;
  onToggleSelectorHighlighter: Function;
  showDeclarationNameEditor: Function;
  showDeclarationValueEditor: Function;
  showNewDeclarationEditor: Function;
  showSelectorEditor: Function;
  query: string;
};

export const Rules: FC<RulesProps> = ({ rules, children, ...rest }) => {
  return (
    <>
      {rules.map(rule => (
        <Rule key={rule.id} rule={rule} {...rest} />
      ))}
    </>
  );
};
