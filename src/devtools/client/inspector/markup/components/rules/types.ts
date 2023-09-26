import { DeclarationState, RuleState } from "ui/suspense/styleCaches";

export type DeclarationStateItem = {
  declaration: DeclarationState;
  type: "declaration";
};

export type InheritanceItem = {
  inheritedSource: string;
  type: "inheritance";
};

export type PseudoElementItem = {
  isPseudoElement: boolean;
  type: "pseudo";
};

export type RuleStateItem = {
  rule: RuleState;
  type: "header" | "footer";
};

export type Item = DeclarationStateItem | InheritanceItem | PseudoElementItem | RuleStateItem;

export function isDeclarationStateItem(itemData: Item): itemData is DeclarationStateItem {
  return itemData.type === "declaration";
}

export function isInheritanceItem(itemData: Item): itemData is InheritanceItem {
  return itemData.type === "inheritance";
}

export function isPseudoElementItem(itemData: Item): itemData is PseudoElementItem {
  return itemData.type === "pseudo";
}

export function isRuleStateItem(itemData: Item): itemData is RuleStateItem {
  return itemData.type === "header" || itemData.type === "footer";
}
