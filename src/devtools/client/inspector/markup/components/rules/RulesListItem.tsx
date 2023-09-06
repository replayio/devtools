import { CSSProperties, Dispatch, Fragment, ReactNode, SetStateAction } from "react";

import {
  isInheritanceItemData,
  isPseudoElementItemData,
  isRuleStateItemData,
} from "devtools/client/inspector/markup/components/rules/types";
import { getItemDataForIndex } from "devtools/client/inspector/markup/components/rules/utils/getItemDataForIndex";
import Expandable from "replay-next/components/Expandable";
import { DeclarationState, RuleState } from "ui/suspense/styleCaches";

import styles from "./RulesListItem.module.css";

export const ITEM_SIZE = 20;

export type ItemData = {
  rules: RuleState[];
  searchText: string;
  setShowPseudoElements: Dispatch<SetStateAction<boolean>>;
  showPseudoElements: boolean;
};

export function RulesListItem({
  data,
  index,
  style,
}: {
  data: ItemData;
  index: number;
  style: CSSProperties;
}) {
  const { rules, searchText, setShowPseudoElements, showPseudoElements } = data;

  const itemData = getItemDataForIndex(index, rules, showPseudoElements);

  if (isInheritanceItemData(itemData)) {
    return (
      <InheritanceRenderer index={index} inheritedSource={itemData.inheritedSource} style={style} />
    );
  } else if (isRuleStateItemData(itemData)) {
    return itemData.type === "header" ? (
      <RuleStateHeaderRenderer
        index={index}
        rule={itemData.rule}
        searchText={searchText}
        style={style}
      />
    ) : (
      <RuleStateFooterRenderer index={index} style={style} />
    );
  } else if (isPseudoElementItemData(itemData)) {
    return (
      <PseudoElementRenderer
        index={index}
        isPseudoElement={itemData.isPseudoElement}
        setShowPseudoElements={setShowPseudoElements}
        showPseudoElements={showPseudoElements}
        style={style}
      />
    );
  } else {
    return (
      <DeclarationStateRenderer
        declaration={itemData.declaration}
        index={index}
        searchText={searchText}
        style={style}
      />
    );
  }
}

function DeclarationStateRenderer({
  declaration,
  index,
  searchText,
  style,
}: {
  declaration: DeclarationState;
  index: number;
  searchText: string;
  style: CSSProperties;
}) {
  let isSearchNameMatch = !!searchText && declaration.name.includes(searchText);
  let isSearchValueMatch = false;

  let title = declaration.name + ": ";
  let values: ReactNode[] = [];

  for (let index = 0; index < declaration.parsedValue.length; index++) {
    const parsedValue = declaration.parsedValue[index];
    if (typeof parsedValue === "string") {
      isSearchValueMatch ||= !!searchText && parsedValue.includes(searchText);
      title += parsedValue;
      values.push(<Fragment key={values.length}>{parsedValue}</Fragment>);
    } else if (parsedValue.type === "color") {
      isSearchValueMatch ||= !!searchText && parsedValue.value.includes(searchText);
      title += parsedValue.value;
      values.push(
        <Fragment key={values.length}>
          <div
            className={styles.ColorToken}
            style={{
              backgroundColor: parsedValue.value,
            }}
          />
          {parsedValue.value}
        </Fragment>
      );
    } else {
      isSearchValueMatch ||= !!searchText && parsedValue.value.includes(searchText);
      title += parsedValue.value;
      values.push(<Fragment key={values.length}>{parsedValue.value}</Fragment>);
    }
  }

  title += ";";

  return (
    <div
      className={styles.DeclarationState}
      data-list-index={index}
      data-overridden={declaration.isOverridden || undefined}
      data-test-name="RuleListItem-DeclarationState"
      style={style}
      title={title.trim()}
    >
      <div className={styles.DeclarationName} data-highlight={isSearchNameMatch || undefined}>
        {declaration.name}
      </div>
      {": "}
      <div className={styles.DeclarationValue} data-highlight={isSearchValueMatch || undefined}>
        {values};
      </div>
    </div>
  );
}

function InheritanceRenderer({
  index,
  inheritedSource,
  style,
}: {
  index: number;
  inheritedSource: string;
  style: CSSProperties;
}) {
  return (
    <div className={styles.Inheritance} data-list-index={index} style={style}>
      {inheritedSource}
    </div>
  );
}

function PseudoElementRenderer({
  index,
  isPseudoElement,
  setShowPseudoElements,
  showPseudoElements,
  style,
}: {
  index: number;
  isPseudoElement: boolean;
  setShowPseudoElements: Dispatch<SetStateAction<boolean>>;
  showPseudoElements: boolean;
  style: CSSProperties;
}) {
  return (
    <div className={styles.PseudoElement} data-list-index={index} style={style}>
      {isPseudoElement ? (
        <Expandable
          children={null}
          defaultOpen={showPseudoElements}
          header={<span>Pseudo-elements</span>}
          headerClassName={styles.PseudoElementExpandableHeader}
          onChange={setShowPseudoElements}
        />
      ) : (
        "This element"
      )}
    </div>
  );
}

function RuleStateFooterRenderer({ index, style }: { index: number; style: CSSProperties }) {
  return (
    <div className={styles.RuleStateFooter} data-list-index={index} style={style}>
      {"}"}
    </div>
  );
}

function RuleStateHeaderRenderer({
  index,
  rule,
  searchText,
  style,
}: {
  index: number;
  rule: RuleState;
  searchText: string;
  style: CSSProperties;
}) {
  const isSearchMatch = !!searchText && rule.selector.selectorText.includes(searchText);

  return (
    <div
      className={styles.RuleStateHeader}
      data-list-index={index}
      data-test-name="RuleListItem-RuleState"
      style={style}
    >
      <div
        className={styles.SelectorText}
        data-highlight={isSearchMatch || undefined}
        data-test-name="RuleListItem-RuleState-Selector"
      >
        {rule.selector.selectorText}
      </div>
      {" {"}
      <div className={styles.SourceLink} data-test-name="RuleListItem-RuleState-Source">
        {rule.sourceLink.label}
      </div>
    </div>
  );
}
