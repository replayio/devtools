import { FC, useCallback, useMemo, useState } from "react";

import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { Rules } from "devtools/client/inspector/rules/components/Rules";
import { Toolbar } from "devtools/client/inspector/rules/components/Toolbar";
import Accordion, { AccordionItem } from "devtools/client/shared/components/Accordion";
import { preferences } from "shared/preferences/Preferences";
import { useAppSelector } from "ui/setup/hooks";

import { RuleInheritance } from "../models/rule";
import { RuleState } from "../reducers/rules";

type InheritedRule = RuleState & { inheritance: RuleInheritance };

const NO_RULES_AVAILABLE: RuleState[] = [];

export const RulesApp: FC = ({}) => {
  const rules = useAppSelector(state => state.rules.rules ?? NO_RULES_AVAILABLE);

  const [rulesQuery, setRulesQuery] = useState("");

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

        output.push(<Rule key={`${inheritedNodeId}|${rule.id}`} rule={rule} query={rulesQuery} />);
      }

      return output;
    },
    [rulesQuery]
  );

  const renderStyleRules = useCallback(
    (rules: RuleState[]) => {
      return <Rules query={rulesQuery} rules={rules} />;
    },
    [rulesQuery]
  );

  const renderPseudoElementRules = useCallback(
    (rules: RuleState[]) => {
      type FCProps<C> = C extends FC<infer P> ? P : never;
      const componentProps: FCProps<typeof Rules> = {
        rules,
        query: rulesQuery,
      };

      const items: AccordionItem[] = [
        {
          component: Rules,
          componentProps,
          header: "Pseudo-elements",
          id: "rules-section-pseudoelement",
          opened: preferences.get("showPseudoElements"),
          onToggle: (opened: boolean) => {
            preferences.set("showPseudoElements", opened);
          },
        },
      ];

      return (
        <>
          <Accordion items={items} />
          <div className="ruleview-header">This Element</div>
        </>
      );
    },
    [rulesQuery]
  );

  const rulesElements = useMemo(() => {
    if (!rulesQuery && rules.length === 0) {
      return <div className="devtools-sidepanel-no-result">No element selected.</div>;
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
        <div id="ruleview-container-focusable" tabIndex={-1}>
          {rules ? (
            rulesElements
          ) : (
            <div className="devtools-sidepanel-no-result">Rules not available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
