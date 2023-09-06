import { RuleState } from "ui/suspense/styleCaches";

// IMPORTANT Keep iteration in sync with getItemDataForIndex
export function getItemCount(rules: RuleState[], showPseudoElements: boolean) {
  let count = 0;
  let currentInheritedNodeId = null;
  let currentPseudoElement = null;

  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];

    if (rule.declarations.filter(declaration => !declaration.isInvisible).length === 0) {
      continue; // Collapse empty sets
    }

    if (!!rule.pseudoElement !== !!currentPseudoElement) {
      count++;
      currentPseudoElement = rule.pseudoElement;
    }

    if (rule.pseudoElement && !showPseudoElements) {
      continue;
    }

    if (rule?.inheritance?.inheritedSource != null) {
      // Render a header the first time a new inheritance section is encountered
      if ((rule.inheritance?.inheritedNodeId ?? null) !== currentInheritedNodeId) {
        currentInheritedNodeId = rule.inheritance?.inheritedNodeId ?? null;

        count++;
      }
    }

    count += 2; // Header and footer
    count += rule.declarations.length;
  }

  return count;
}
