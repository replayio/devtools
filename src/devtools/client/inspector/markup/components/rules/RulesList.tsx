import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";

import { getItemCount } from "devtools/client/inspector/markup/components/rules/utils/getItemCount";
import { RuleState } from "ui/suspense/styleCaches";

import { ITEM_SIZE, ItemData, RulesListItem } from "./RulesListItem";

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

  const outerRef = useRef<HTMLDivElement>(null);

  const itemCount = useMemo(
    () => getItemCount(rules, showPseudoElements),
    [rules, showPseudoElements]
  );

  const itemData = useMemo<ItemData>(
    () => ({
      rules,
      searchText,
      setShowPseudoElements,
      showPseudoElements,
    }),
    [rules, showPseudoElements, searchText]
  );

  // react-window doesn't provide a way to declaratively set data-* attributes
  useEffect(() => {
    const element = outerRef.current;
    if (element) {
      element.setAttribute("data-test-id", "RulesList");
    }
  });

  if (itemCount === 0) {
    return noContentFallback;
  }

  return (
    <List
      children={RulesListItem}
      height={height}
      itemCount={itemCount}
      itemData={itemData}
      itemSize={ITEM_SIZE}
      outerRef={outerRef}
      width="100%"
    />
  );
}
