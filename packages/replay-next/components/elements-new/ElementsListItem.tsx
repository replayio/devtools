import assert from "assert";
import { PauseId } from "@replayio/protocol";
import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  UIEvent,
  useMemo,
  useState,
} from "react";

import { ElementsListData } from "replay-next/components/elements-new/ElementsListData";
import { useElementsListItemContextMenu } from "replay-next/components/elements-new/hooks/useElementsListItemContextMenu";
import { Attributes, Item, ItemDisplayMode } from "replay-next/components/elements-new/types";
import Icon from "replay-next/components/Icon";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { GenericListItemData } from "replay-next/components/windowing/GenericList";
import { useMultiClick } from "replay-next/src/hooks/useMultiClick";
import { truncateMiddle } from "replay-next/src/utils/string";
import { ReplayClientInterface } from "shared/client/types";

import styles from "./ElementsListItem.module.css";

export type ElementsListItemData = {
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
};

const COLLAPSE_DATA_URL_REGEX = /^data.+base64/;
const COLLAPSE_DATA_URL_LENGTH = 60;
const MAX_ATTRIBUTE_LENGTH = 50;

export const ITEM_SIZE = 16;

export function ElementsListItem({
  data,
  index,
  style,
}: {
  data: GenericListItemData<Item, ElementsListItemData>;
  index: number;
  style: CSSProperties;
}) {
  const { itemData, listData } = data;
  const { pauseId, replayClient } = itemData;

  const selectedIndex = listData.getSelectedIndex();

  const elementsListData = listData as ElementsListData;

  const item = elementsListData.getItemAtIndex(index);
  const { attributes, depth, displayMode, nodeType, objectId, tagName, textContent } = item;

  const { contextMenu, onContextMenu } = useElementsListItemContextMenu({
    elementsListData,
    item,
    pauseId,
    replayClient,
  });

  const onContextMenuWrapper = (event: UIEvent) => {
    listData.setSelectedIndex(index);
    onContextMenu(event);
  };

  const hasChildren = displayMode !== "empty";
  const isExpanded = displayMode === "head" || displayMode === "tail";
  const isTail = displayMode === "tail";

  const toggle = () => {
    elementsListData.toggleNodeExpanded(objectId, displayMode === "collapsed" ? true : false);
  };

  let rendered: ReactNode = null;

  switch (nodeType) {
    case Node.DOCUMENT_NODE:
    case Node.DOCUMENT_TYPE_NODE: {
      rendered = tagName;
      break;
    }
    case Node.TEXT_NODE: {
      rendered = textContent;
      break;
    }
    default: {
      assert(tagName);

      rendered = (
        <HTMLNodeRenderer attributes={attributes} displayMode={displayMode} displayName={tagName} />
      );
      break;
    }
  }

  if (hasChildren && !isTail) {
    rendered = (
      <>
        <span
          className={isExpanded ? styles.IconContainerRotated : styles.IconContainer}
          data-is-expanded={isExpanded ? "true" : "false"}
          onClick={toggle}
          role="button"
        >
          <Icon className={styles.ArrowIcon} type="arrow" />
        </span>
        {rendered}
      </>
    );
  } else {
    rendered = (
      <>
        <div className={styles.Spacer} />
        {rendered}
      </>
    );
  }

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    listData.setSelectedIndex(index);
  };

  const [subTreeIndicatorDepth, selectedItemId] = useMemo(() => {
    if (selectedIndex == null) {
      return [null, null];
    } else {
      const { depth: rootDepth, objectId: rootId } = elementsListData.getItemAtIndex(selectedIndex);

      if (isTail && objectId === rootId) {
        return [rootDepth, rootId];
      } else {
        return [elementsListData.isNodeInSubTree(objectId, rootId) ? rootDepth : null, rootId];
      }
    }
  }, [elementsListData, objectId, isTail, selectedIndex]);

  let dataType = "";
  switch (nodeType) {
    case Node.COMMENT_NODE:
      dataType = "comment";
      break;
    case Node.DOCUMENT_NODE:
      dataType = "document";
      break;
    case Node.DOCUMENT_TYPE_NODE:
      dataType = "documentType";
      break;
    case Node.TEXT_NODE:
      dataType = "text";
      break;
  }

  return (
    <>
      <div
        className={styles.Node}
        data-list-index={index}
        data-selected={index === selectedIndex || undefined}
        data-test-name="ElementsListItem"
        data-type={dataType}
        key={objectId /* Reset so toggle animations aren't reused */}
        onClick={onClick}
        onContextMenu={onContextMenuWrapper}
        style={
          {
            ...style,
            width: undefined,
            "--data-depth": depth != null ? `${depth}rem` : undefined,
          } as CSSProperties
        }
      >
        {subTreeIndicatorDepth != null && (
          <div
            className={styles.SelectedSubTreeLine}
            data-is-selected-node={selectedItemId === objectId || undefined}
            style={
              {
                "--data-depth": `${subTreeIndicatorDepth}rem`,
              } as CSSProperties
            }
          />
        )}
        {rendered}
      </div>
      {contextMenu}
    </>
  );
}

function HTMLNodeRenderer({
  attributes,
  displayMode,
  displayName,
}: {
  attributes: Attributes;
  displayMode: ItemDisplayMode;
  displayName: string;
}) {
  let renderedAttributes: ReactNode[] = [];
  for (let key in attributes) {
    renderedAttributes.push(" ");
    renderedAttributes.push(<HtmlAttributeRenderer key={key} name={key} value={attributes[key]} />);
  }

  switch (displayMode) {
    case "empty":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;</span>
          {displayName}
          {renderedAttributes}
          <span className={styles.HTMLBracket}> /&gt;</span>
        </span>
      );
    case "collapsed":
      return (
        <>
          <span className={styles.HTMLTag}>
            <span className={styles.HTMLBracket}>&lt;</span>
            {displayName}
            {renderedAttributes}
            <span className={styles.HTMLBracket}>&gt;</span>
          </span>
          …
          <span className={styles.HTMLTag}>
            <span className={styles.HTMLBracket}>&lt;/</span>
            {displayName}
            <span className={styles.HTMLBracket}>&gt;</span>
          </span>
        </>
      );
    case "head":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;</span>
          {displayName}
          {renderedAttributes}
          <span className={styles.HTMLBracket}>&gt;</span>
        </span>
      );
    case "tail":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;/</span>
          {displayName}
          <span className={styles.HTMLBracket}>&gt;</span>
        </span>
      );
  }
}

function HtmlAttributeRenderer({ name, value }: { name: string; value: string }) {
  const [focusOn, setFocusOn] = useState<"all" | "name" | "value" | null>(null);

  const { onClick } = useMultiClick({
    onDoubleClick: ({ target }) => {
      switch ((target as HTMLSpanElement).getAttribute("data-name")) {
        case "HtmlAttributeName":
          setFocusOn("name");
          break;
        case "HtmlAttributeValue":
          setFocusOn("value");
          break;
      }
    },
    onTripleClick: () => {
      setFocusOn("all");
    },
  });

  const onBlur = () => {
    setFocusOn(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "c":
      case "C":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();

          switch (focusOn) {
            case "all":
              copyTextToClipboard(`${name}="${value}"`);
              break;
            case "name":
              copyTextToClipboard(name);
              break;
            case "value":
              copyTextToClipboard(value);
              break;
          }
        }
        break;
    }
  };

  let displayValue: ReactNode = null;
  if (value.match(COLLAPSE_DATA_URL_REGEX)) {
    // Truncates base64 attribute values
    displayValue = truncateMiddle(value, COLLAPSE_DATA_URL_LENGTH, "…");
  } else {
    displayValue = truncateMiddle(value, MAX_ATTRIBUTE_LENGTH, "…");
  }

  return (
    <span
      className={styles.HtmlAttribute}
      data-selected={focusOn === "all" || undefined}
      onBlur={onBlur}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      title={`${name}="${value}"`}
    >
      <span
        className={styles.HtmlAttributeName}
        data-name="HtmlAttributeName"
        data-selected={focusOn === "name" || undefined}
      >
        {name}
      </span>
      {value && (
        <>
          <span className={styles.Separator}>=</span>
          <span
            className={styles.HtmlAttributeValue}
            data-name="HtmlAttributeValue"
            data-selected={focusOn === "value" || undefined}
          >
            "{displayValue}"
          </span>
        </>
      )}
    </span>
  );
}
