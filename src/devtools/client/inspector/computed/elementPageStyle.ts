import { UIStore } from "ui/actions";
import { getRules } from "../rules/selectors/rules";

interface SelectorInfo {
  name: string;
  value: string;
  sourceText: string;
  overridden: boolean;
  rule: {
    type: number;
    parentStyleSheet: {
      href: string;
    };
  };
}

export class ElementPageStyle {
  constructor(private readonly store: UIStore) {}

  getMatchedSelectors(property: string) {
    const selectorInfos: SelectorInfo[] = [];

    const rules = getRules(this.store.getState()) || [];
    for (const rule of rules) {
      if (rule.isUnmatched) continue;

      for (const declaration of rule.declarations) {
        if (declaration.name === property) {
          selectorInfos.push({
            name: property,
            value: declaration.value,
            sourceText: rule.selector.selectorText,
            overridden: declaration.isOverridden,
            rule: {
              type: rule.type,
              parentStyleSheet: {
                href: rule.sourceLink.title || "",
              },
            },
          });
        }
      }
    }

    return selectorInfos;
  }
}
