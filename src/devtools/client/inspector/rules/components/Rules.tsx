import React from "react";

import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { RuleState } from "ui/suspense/styleCaches";

type RulesProps = {
  rules: RuleState[];
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
