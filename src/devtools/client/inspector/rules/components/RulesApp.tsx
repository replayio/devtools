const Services = require("Services");
import React, { FC, useCallback, useMemo, useState } from "react";

import Accordion from "devtools/client/shared/components/Accordion";
import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { Rules } from "devtools/client/inspector/rules/components/Rules";
import { Toolbar } from "devtools/client/inspector/rules/components/Toolbar";

import { getStr } from "devtools/client/inspector/rules/utils/l10n";
import { useSelector } from "react-redux";
import { RulesState, RuleState } from "../state/rules";
import { RuleInheritance } from "../models/rule";

const SHOW_PSEUDO_ELEMENTS_PREF = "devtools.inspector.show_pseudo_elements";

type InheritedRule = RuleState & { inheritance: RuleInheritance };

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

  const ruleProps = useMemo(
    () => ({
      onToggleDeclaration,
      onToggleSelectorHighlighter,
      showDeclarationNameEditor,
      showDeclarationValueEditor,
      showNewDeclarationEditor,
      showSelectorEditor,
    }),
    []
  );

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

  const renderInheritedRules = useCallback(
    (rules: InheritedRule[]) => {
      const output = [];
      let lastInheritedNodeId;

      for (const rule of rules) {
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
          <Rule
            key={`${inheritedNodeId}|${rule.id}`}
            rule={rule}
            {...ruleProps}
            query={rulesQuery}
          />
        );
      }

      return output;
    },
    [rulesQuery, ruleProps]
  );

  const renderStyleRules = useCallback(
    (rules: RuleState[]) => {
      return <Rules {...ruleProps} query={rulesQuery} rules={rules} />;
    },
    [rulesQuery, ruleProps]
  );

  const renderPseudoElementRules = useCallback(
    (rules: RuleState[]) => {
      type FCProps<C> = C extends FC<infer P> ? P : never;
      const componentProps: FCProps<typeof Rules> = {
        rules,
        query: rulesQuery,
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
    },
    [ruleProps, rulesQuery]
  );

  const rulesElements = useMemo(() => {
    if (!rulesQuery && rules.length === 0) {
      return <div className="devtools-sidepanel-no-result">{getStr("rule.empty")}</div>;
    }

    const nonEmptyRules = rules.filter(rule =>
      rule.declarations.some(declaration => !declaration.isInvisible)
    );

    const filteredRules = rulesQuery
      ? nonEmptyRules.filter(
          rule =>
            rule.selector.selectors?.some(selector => selector.match(rulesQuery)) ||
            rule.declarations.some(
              declaration =>
                declaration.name.match(rulesQuery) || declaration.value.match(rulesQuery)
            )
        )
      : nonEmptyRules;

    if (!filteredRules.length) {
      return <div className="devtools-sidepanel-no-result">No matching selector or style.</div>;
    }

    const inheritedRules: InheritedRule[] = [];
    const pseudoElementRules: RuleState[] = [];
    const styleRules: RuleState[] = [];

    for (const rule of filteredRules) {
      if (rule.inheritance) {
        inheritedRules.push(rule as InheritedRule);
      } else if (rule.pseudoElement) {
        pseudoElementRules.push(rule);
      } else {
        styleRules.push(rule);
      }
    }

    return (
      <>
        {pseudoElementRules.length !== 0 && renderPseudoElementRules(pseudoElementRules)}
        {styleRules.length !== 0 && renderStyleRules(styleRules)}
        {inheritedRules.length !== 0 && renderInheritedRules(inheritedRules)}
      </>
    );
  }, [rules, rulesQuery, renderInheritedRules, renderStyleRules, renderPseudoElementRules]);

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
