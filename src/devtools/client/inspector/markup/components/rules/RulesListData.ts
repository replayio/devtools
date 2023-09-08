import { RulesListItemData } from "devtools/client/inspector/markup/components/rules/RulesListItem";
import { GenericListData } from "replay-next/components/windowing/GenericListData";
import { RuleState } from "ui/suspense/styleCaches";

import { Item } from "./types";

export class RulesListData extends GenericListData<Item, RulesListItemData> {
  private _rules: RuleState[] = [];
  private _showPseudoElements: boolean = false;

  getItemAtIndexImplementation(index: number): Item {
    let currentInheritedNodeId = null;
    let currentPseudoElement = null;

    for (let rulesIndex = 0; rulesIndex < this._rules.length; rulesIndex++) {
      const rule = this._rules[rulesIndex];

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

      if (rule.pseudoElement && !this._showPseudoElements) {
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

  getItemCountImplementation(): number {
    let count = 0;
    let currentInheritedNodeId = null;
    let currentPseudoElement = null;

    for (let index = 0; index < this._rules.length; index++) {
      const rule = this._rules[index];

      if (rule.declarations.filter(declaration => !declaration.isInvisible).length === 0) {
        continue; // Collapse empty sets
      }

      if (!!rule.pseudoElement !== !!currentPseudoElement) {
        count++;
        currentPseudoElement = rule.pseudoElement;
      }

      if (rule.pseudoElement && !this._showPseudoElements) {
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

  updateItemDataImplementation(itemData: RulesListItemData): boolean {
    const { rules, showPseudoElements } = itemData;

    if (this._rules != rules || this._showPseudoElements != showPseudoElements) {
      this._rules = rules;
      this._showPseudoElements = showPseudoElements;

      return true;
    }

    return false;
  }
}
