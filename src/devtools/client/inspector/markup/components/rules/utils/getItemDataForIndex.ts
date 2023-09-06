import { RuleState } from "ui/suspense/styleCaches";

import { ItemData } from "../types";

// IMPORTANT Keep iteration in sync with getItemCount
export function getItemDataForIndex(
  index: number,
  rules: RuleState[],
  showPseudoElements: boolean
): ItemData {
  let currentInheritedNodeId = null;
  let currentPseudoElement = null;

  for (let rulesIndex = 0; rulesIndex < rules.length; rulesIndex++) {
    const rule = rules[rulesIndex];

    if (rule.declarations.filter(declaration => !declaration.isInvisible).length === 0) {
      continue; // Collapse empty sets
    }

    if (!!rule.pseudoElement !== !!currentPseudoElement) {
      currentPseudoElement = rule.pseudoElement;

      if (index === 0) {
        return {
          isPseudoElement: !!rule.pseudoElement,
          type: "pseudo",
        };
      } else {
        index--;
      }
    }

    if (rule.pseudoElement && !showPseudoElements) {
      continue;
    }

    if (rule.inheritance?.inheritedSource != null) {
      if ((rule.inheritance?.inheritedNodeId ?? null) !== currentInheritedNodeId) {
        currentInheritedNodeId = rule.inheritance?.inheritedNodeId ?? null;

        if (index === 0) {
          return {
            inheritedSource: rule.inheritance.inheritedSource,
            type: "inheritance",
          };
        } else {
          index--;
        }
      }
    }

    if (index === 0) {
      return {
        rule,
        type: "header",
      };
    } else {
      index--;
    }

    for (
      let declarationIndex = 0;
      declarationIndex < rule.declarations.length;
      declarationIndex++
    ) {
      if (index === 0) {
        return {
          declaration: rule.declarations[declarationIndex],
          type: "declaration",
        };
      } else {
        index--;
      }
    }

    if (index === 0) {
      return {
        rule,
        type: "footer",
      };
    } else {
      index--;
    }
  }

  throw Error("Could not find data for row");
}
