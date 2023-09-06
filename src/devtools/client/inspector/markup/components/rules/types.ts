import { DeclarationState, RuleState } from "ui/suspense/styleCaches";

export type DeclarationStateItemData = {
  declaration: DeclarationState;
  type: "declaration";
};

export type InheritanceItemData = {
  inheritedSource: string;
  type: "inheritance";
};

export type PseudoElementItemData = {
  isPseudoElement: boolean;
  type: "pseudo";
};

export type RuleStateItemData = {
  rule: RuleState;
  type: "header" | "footer";
};

export type ItemData =
  | DeclarationStateItemData
  | InheritanceItemData
  | PseudoElementItemData
  | RuleStateItemData;

export function isDeclarationStateItemData(
  itemData: ItemData
): itemData is DeclarationStateItemData {
  return itemData.type === "declaration";
}

export function isInheritanceItemData(itemData: ItemData): itemData is InheritanceItemData {
  return itemData.type === "inheritance";
}

export function isPseudoElementItemData(itemData: ItemData): itemData is PseudoElementItemData {
  return itemData.type === "pseudo";
}

export function isRuleStateItemData(itemData: ItemData): itemData is RuleStateItemData {
  return itemData.type === "header" || itemData.type === "footer";
}
