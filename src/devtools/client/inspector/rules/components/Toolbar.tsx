/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { FC } from "react";
// import { useSelector } from "react-redux";
// import { RulesState } from "../state/rules";
import { SearchBox } from "devtools/client/inspector/rules/components/SearchBox";
const { getStr } = require("devtools/client/inspector/rules/utils/l10n");

type ToolbarProps = {
  onAddClass: Function;
  onAddRule: Function;
  onSetClassState: Function;
  onToggleClassPanelExpanded: Function;
  onTogglePseudoClass: Function;
};

export const Toolbar: FC<ToolbarProps> = ({
  onAddClass,
  onAddRule,
  onSetClassState,
  onToggleClassPanelExpanded,
  onTogglePseudoClass,
}) => {
  // const { isAddRuleEnable } = useSelector((state: { rules: RulesState }) => ({
  //   isAddRuleEnabled: state.rules.isAddRuleEnabled,
  // }));

  // const [isPseudoExpanded, setIsPseudoExpanded] = useState(false)

  // const onAddRuleClick = (event: React.MouseEvent) => {
  // }

  // const onClassPanelToggle = (event: React.MouseEvent) => {
  // }

  // const onPseudoClassPanelToggle = (event: React.MouseEvent) => {
  // }

  return (
    <div id="ruleview-toolbar-container">
      <div id="ruleview-toolbar" className="devtools-toolbar devtools-input-toolbar">
        <SearchBox />
        {/*
        dom.div({ className: "devtools-separator" }),
        dom.div(
          { id: "ruleview-command-toolbar" },
          dom.button({
            id: "pseudo-class-panel-toggle",
            className: "devtools-button" + (isPseudoClassPanelExpanded ? " checked" : ""),
            onClick: this.onPseudoClassPanelToggle,
            title: getStr("rule.togglePseudo.tooltip"),
          }),
          dom.button({
            id: "class-panel-toggle",
            className: "devtools-button" + (isClassPanelExpanded ? " checked" : ""),
            onClick: this.onClassPanelToggle,
            title: getStr("rule.classPanel.toggleClass.tooltip"),
          }),
          dom.button({
            id: "ruleview-add-rule-button",
            className: "devtools-button",
            disabled: !isAddRuleEnabled,
            onClick: this.onAddRuleClick,
            title: getStr("rule.addRule.tooltip"),
          })
        )
       */}
      </div>
      {/*
        isClassPanelExpanded
          ? ClassListPanel({
              onAddClass: this.props.onAddClass,
              onSetClassState: this.props.onSetClassState,
            })
          : null,
        isPseudoClassPanelExpanded
          ? PseudoClassPanel({
              onTogglePseudoClass: this.props.onTogglePseudoClass,
            })
          : null
        */}
    </div>
  );
};
