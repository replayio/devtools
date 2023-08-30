import { FC, useCallback, useContext, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { Rule } from "devtools/client/inspector/rules/components/Rule";
import { Rules } from "devtools/client/inspector/rules/components/Rules";
import { Toolbar } from "devtools/client/inspector/rules/components/Toolbar";
import Accordion, { AccordionItem } from "devtools/client/shared/components/Accordion";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { userData } from "shared/user-data/GraphQL/UserData";
import { useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";
import { cssRulesCache } from "ui/suspense/styleCaches";

import { getSelectedNodeId } from "../../markup/selectors/markup";
import { RuleInheritance } from "../models/rule";
import { RuleState } from "../reducers/rules";

type InheritedRule = RuleState & { inheritance: RuleInheritance };

const NO_RULES_AVAILABLE: RuleState[] = [];

export const RulesApp: FC = ({}) => {
  const replayClient = useContext(ReplayClientContext);
  const { pauseId, selectedNodeId } = useAppSelector(
    state => ({
      pauseId: getPauseId(state),
      selectedNodeId: getSelectedNodeId(state),
    }),
    shallowEqual
  );

  const { value: node, status: nodeStatus } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    selectedNodeId!
  );

  const canHaveRules = nodeStatus === "resolved" ? node?.isElement : false;

  const { value: cachedStyles, status } = useImperativeCacheValue(
    cssRulesCache,
    replayClient,
    canHaveRules ? pauseId : undefined,
    canHaveRules ? selectedNodeId : undefined
  );

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

  let rules = NO_RULES_AVAILABLE;
  if (status === "resolved" && cachedStyles) {
    rules = cachedStyles.rules;
  }

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
          opened: userData.get("inspector_showPseudoElements"),
          onToggle: (opened: boolean) => {
            userData.set("inspector_showPseudoElements", opened);
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
