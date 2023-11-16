import assert from "assert";
import { CSSProperties, ReactNode } from "react";

import Icon from "replay-next/components/Icon";
import { GenericListItemData } from "replay-next/components/windowing/GenericList";
import { truncateMiddle } from "replay-next/src/utils/string";
import { Badge } from "ui/components/SecondaryToolbox/react-devtools/components/Badge";
import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import { StoreWithInternals } from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { ReactElement } from "ui/components/SecondaryToolbox/react-devtools/types";

import styles from "./ReactDevToolsListItem.module.css";

export const ITEM_SIZE = 20;

export const MAX_KEY_LENGTH = 20;

export type ItemData = {
  store: StoreWithInternals;
};

export function ReactDevToolsListItem({
  data,
  index,
  style,
}: {
  data: GenericListItemData<ReactElement, ItemData>;
  index: number;
  style: CSSProperties;
}) {
  const { listData, selectedItemIndex } = data;

  const elementsListData = listData as ReactDevToolsListData;
  const element = elementsListData.getItemAtIndex(index);
  assert(element);

  const { children, depth, displayName, hocDisplayNames, id, isCollapsed, key } = element;

  let rendered: ReactNode = (
    <>
      <div className={styles.ElementName} data-test-name="ReactDevTools-Name">
        {displayName}
      </div>
      {hocDisplayNames && hocDisplayNames.length > 0 && <Badge children={hocDisplayNames[0]} />}
      {key && <Badge children={truncateMiddle(`${key}`, MAX_KEY_LENGTH)} title={`${key}`} />}
    </>
  );

  if (children.length > 0) {
    rendered = (
      <div className={styles.Content} test-data-name="ListContent">
        <div
          className={isCollapsed ? styles.IconContainer : styles.IconContainerRotated}
          onClick={() => elementsListData.toggleCollapsed(element)}
          role="button"
        >
          <Icon className={styles.Icon} type="arrow" />
        </div>
        {rendered}
      </div>
    );
  } else {
    rendered = (
      <div className={styles.Content} test-data-name="ListContent">
        <div className={styles.Spacer} />
        {rendered}
      </div>
    );
  }

  return (
    <div
      className={styles.Row}
      data-depth={depth}
      data-list-index={index}
      data-element-id={id}
      data-selected={index == selectedItemIndex || undefined}
      data-test-name="ReactDevToolsListItem"
      key={id /* Reset so toggle animations aren't reused */}
      onClick={() => elementsListData.selectElement(element)}
      style={
        {
          ...style,
          "--data-depth": depth,
        } as CSSProperties
      }
    >
      {rendered}
    </div>
  );
}
