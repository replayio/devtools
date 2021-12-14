/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC } from "react";
import Rule from "devtools/client/inspector/rules/components/Rule";
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
