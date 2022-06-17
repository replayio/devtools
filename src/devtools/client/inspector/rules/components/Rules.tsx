import React from "react";
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
  children?: React.ReactNode;
};

export const Rules = ({ rules, children, ...rest }: RulesProps) => {
  return (
    <>
      {rules.map(rule => (
        <Rule key={rule.id} rule={rule} {...rest} />
      ))}
    </>
  );
};
