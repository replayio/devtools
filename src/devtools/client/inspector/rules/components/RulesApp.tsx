const Services = require("Services");
import React, { FC, useMemo, useState } from "react";

import Accordion from "devtools/client/shared/components/Accordion";
import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { Rules } from "devtools/client/inspector/rules/components/Rules";
import { Toolbar } from "devtools/client/inspector/rules/components/Toolbar";

import { getStr } from "devtools/client/inspector/rules/utils/l10n";
import { useSelector } from "react-redux";
import { RulesState, RuleState } from "../state/rules";

const SHOW_PSEUDO_ELEMENTS_PREF = "devtools.inspector.show_pseudo_elements";

type RulesAppProps = {
  onToggleDeclaration: Function;
  onToggleSelectorHighlighter: Function;
  rules: RuleState[];
  showContextMenu: Function;
  showDeclarationNameEditor: Function;
  showDeclarationValueEditor: Function;
  showNewDeclarationEditor: Function;
  showSelectorEditor: Function;
};

export const RulesApp: FC<RulesAppProps> = ({
  showContextMenu,
  onToggleDeclaration,
  showDeclarationValueEditor,
  showNewDeclarationEditor,
  onToggleSelectorHighlighter,
  showDeclarationNameEditor,
  showSelectorEditor,
}) => {
  const { rules } = useSelector((state: { rules: RulesState }) => ({
    rules: state.rules.rules || [],
  }));

  const [rulesQuery, setRulesQuery] = useState("");

  const ruleProps = {
    onToggleDeclaration,
    onToggleSelectorHighlighter,
    showDeclarationNameEditor,
    showDeclarationValueEditor,
    showNewDeclarationEditor,
    showSelectorEditor,
    query: rulesQuery,
  };

  const onContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      event.currentTarget.closest("input[type=text]") ||
      event.currentTarget.closest("input:not([type])") ||
      event.currentTarget.closest("textarea")
    ) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    showContextMenu(event);
  };

  const renderInheritedRules = (rules: RuleState[]) => {
    if (!rules.length) {
      return null;
    }

    const output = [];
    let lastInheritedNodeId;

    for (const rule of rules) {
      if (!rule.inheritance) {
        continue;
      }

      const { inheritedNodeId, inheritedSource } = rule.inheritance;

      if (inheritedNodeId !== lastInheritedNodeId) {
        lastInheritedNodeId = inheritedNodeId;
        output.push(
          <div key={inheritedNodeId} className="ruleview-header">
            {inheritedSource}
          </div>
        );
      }

      output.push(
        <Rule key={`${inheritedNodeId}|${rule.id}`} rule={rule} {...ruleProps} query={rulesQuery} />
      );
    }

    return output;
  };

  const renderStyleRules = (rules: RuleState[]) => {
    if (!rules.length) {
      return null;
    }

    return <Rules {...ruleProps} rules={rules} />;
  };

  const renderPseudoElementRules = (rules: RuleState[]) => {
    if (!rules.length) {
      return null;
    }

    type FCProps<C> = C extends FC<infer P> ? P : never;
    const componentProps: FCProps<typeof Rules> = {
      rules,
      ...ruleProps,
    };

    const items = [
      {
        component: Rules,
        componentProps,
        header: getStr("rule.pseudoElement"),
        id: "rules-section-pseudoelement",
        opened: Services.prefs.getBoolPref(SHOW_PSEUDO_ELEMENTS_PREF),
        onToggle: (opened: boolean) => {
          Services.prefs.setBoolPref(SHOW_PSEUDO_ELEMENTS_PREF, opened);
        },
      },
    ];

    return (
      <>
        <Accordion items={items} />
        <div className="ruleview-header">{getStr("rule.selectedElement")}</div>
      </>
    );
  };

  const rulesElements = useMemo(() => {
    if (!rulesQuery && rules.length === 0) {
      return <div className="devtools-sidepanel-no-result">{getStr("rule.empty")}</div>;
    }

    const inheritedRules = [];
    const pseudoElementRules = [];
    const styleRules = [];

    const filteredRules = rulesQuery
      ? rules.filter(
          rule =>
            rule.selector.selectors?.some(selector => selector.match(rulesQuery)) ||
            rule.declarations.some(
              declaration =>
                declaration.name.match(rulesQuery) || declaration.value.match(rulesQuery)
            )
        )
      : rules;

    for (const rule of filteredRules) {
      if (rule.inheritance) {
        inheritedRules.push(rule);
      } else if (rule.pseudoElement) {
        pseudoElementRules.push(rule);
      } else {
        styleRules.push(rule);
      }
    }

    if (!filteredRules.length) {
      return <div className="devtools-sidepanel-no-result">No matching selector or style.</div>;
    }

    return (
      <>
        {renderPseudoElementRules(pseudoElementRules)}
        {renderStyleRules(styleRules)}
        {renderInheritedRules(inheritedRules)}
      </>
    );
  }, [rules, rulesQuery]);

  return (
    <div id="sidebar-panel-ruleview" className="theme-sidebar inspector-tabpanel">
      <Toolbar rulesQuery={rulesQuery} onRulesQueryChange={setRulesQuery} />
      <div id="ruleview-container" className="ruleview">
        <div id="ruleview-container-focusable" onContextMenu={onContextMenu} tabIndex={-1}>
          {rules ? (
            rulesElements
          ) : (
            <div className="devtools-sidepanel-no-result">{getStr("rule.notAvailable")}</div>
          )}
        </div>
      </div>
    </div>
  );
};
