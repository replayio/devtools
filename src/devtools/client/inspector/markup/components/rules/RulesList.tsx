import { ReactElement, useMemo, useState } from "react";

import { RulesListData } from "devtools/client/inspector/markup/components/rules/RulesListData";
import { GenericList } from "replay-next/components/windowing/GenericList";
import { RuleState } from "ui/suspense/styleCaches";

import { ITEM_SIZE, RulesListItem, RulesListItemData } from "./RulesListItem";

export function RulesList({
  height,
  noContentFallback,
  rules,
  searchText,
}: {
  height: number;
  noContentFallback: ReactElement;
  rules: RuleState[];
  searchText: string;
}) {
  const [showPseudoElements, setShowPseudoElements] = useState(true);

  const rulesListData = useMemo(
    () => new RulesListData(rules, showPseudoElements),
    [rules, showPseudoElements]
  );

  const itemData = useMemo<RulesListItemData>(
    () => ({
      rules,
      searchText,
      setShowPseudoElements,
      showPseudoElements,
    }),
    [rules, showPseudoElements, searchText]
  );

  return (
    <GenericList
      dataTestId="RulesList"
      fallbackForEmptyList={noContentFallback}
      height={height}
      itemData={itemData}
      itemRendererComponent={RulesListItem}
      itemSize={ITEM_SIZE}
      listData={rulesListData}
      width="100%"
    />
  );
}
