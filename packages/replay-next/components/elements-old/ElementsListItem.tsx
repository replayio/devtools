import { Node as ProtocolNode } from "@replayio/protocol";
import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  UIEvent,
  useMemo,
  useState,
} from "react";

import { ElementsListData } from "replay-next/components/elements-old/ElementsListData";
import { useElementsListItemContextMenu } from "replay-next/components/elements-old/hooks/useElementsListItemContextMenu";
import { Item } from "replay-next/components/elements-old/types";
import Icon from "replay-next/components/Icon";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { GenericListItemData } from "replay-next/components/windowing/GenericList";
import { useMultiClick } from "replay-next/src/hooks/useMultiClick";
import { truncateMiddle } from "replay-next/src/utils/string";

import styles from "./ElementsListItem.module.css";

export type ElementsListItemData = {};

const COLLAPSE_DATA_URL_REGEX = /^data.+base64/;
const COLLAPSE_DATA_URL_LENGTH = 60;
const MAX_ATTRIBUTE_LENGTH = 50;
const MAX_PLAIN_TEXT_LENGTH = 250;

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
  const { listData } = data;

  const selectedIndex = listData.getSelectedIndex();

  const elementsListData = listData as ElementsListData;

  const item = elementsListData.getItemAtIndex(index);
  const { depth, element, id, isExpanded, isTail } = item;

  const { contextMenu, onContextMenu } = useElementsListItemContextMenu({
    elementsListData,
    item,
  });

  const onContextMenuWrapper = (event: UIEvent) => {
    listData.setSelectedIndex(index);
    onContextMenu(event);
  };

  const { filteredChildNodeIds, node } = element;

  const hasChildren = filteredChildNodeIds.length > 0;

  const toggle = () => {
    elementsListData.toggleNodeExpanded(id, !isExpanded);
  };

  let dataType;
  let rendered;

  // IMPORTANT
  // Keep this in sync with the toString logic in useElementsListItemContextMenu
  switch (node.nodeType) {
    case Node.COMMENT_NODE: {
      let nodeValue = node.nodeValue ?? "";
      nodeValue = nodeValue.trim();
      nodeValue = nodeValue.replace(/\n\s+/g, " ");

      dataType = "comment";
      rendered = `<!-- ${nodeValue} -->`;
      break;
    }
    case Node.DOCUMENT_NODE: {
      dataType = "document";
      rendered = node.nodeName;
      break;
    }
    case Node.DOCUMENT_TYPE_NODE: {
      dataType = "doctype";
      rendered = `<!DOCTYPE ${node.nodeName}>`;
      break;
    }
    case Node.TEXT_NODE: {
      dataType = "text";

      let text = (node.nodeValue ?? "").trim().replace(/[\n\r]/g, "\\n");
      if (text.length > MAX_PLAIN_TEXT_LENGTH) {
        text = text.substring(0, MAX_PLAIN_TEXT_LENGTH) + "…";
      }

      rendered = <span>{text}</span>;
      break;
    }
    default: {
      if (!hasChildren) {
        rendered = <HTMLNodeRenderer mode="collapsed-no-content" node={node} />;
      } else if (!isExpanded) {
        rendered = <HTMLNodeRenderer mode="collapsed-with-content" node={node} />;
      } else {
        rendered = isTail ? (
          <HTMLNodeRenderer mode="tail" node={node} />
        ) : (
          <HTMLNodeRenderer mode="head" node={node} />
        );
      }
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
      const { depth: rootDepth, id: rootId } = elementsListData.getItemAtIndex(selectedIndex);

      if (isTail && id === rootId) {
        return [rootDepth, rootId];
      } else {
        return [elementsListData.isNodeInSubTree(id, rootId) ? rootDepth : null, rootId];
      }
    }
  }, [elementsListData, id, isTail, selectedIndex]);

  return (
    <>
      <div
        className={styles.Node}
        data-list-index={index}
        data-loading={hasChildren === null || undefined}
        data-selected={index === selectedIndex || undefined}
        data-test-name="ElementsListItem"
        data-type={dataType}
        key={id /* Reset so toggle animations aren't reused */}
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
            data-is-selected-node={selectedItemId === id || undefined}
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
  mode,
  node,
}: {
  mode: "collapsed-with-content" | "collapsed-no-content" | "head" | "tail";
  node: ProtocolNode;
}) {
  const nodeName = node.nodeName.toLowerCase();

  const sortedAttributes = useMemo(() => {
    if (!node.attributes) {
      return [];
    } else {
      return node.attributes.concat().sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [node.attributes]);

  let attributes: ReactNode[] = [];
  sortedAttributes.forEach(({ name, value }, index) => {
    attributes.push(" ");
    attributes.push(<HtmlAttributeRenderer key={name} name={name} value={value} />);
  });

  switch (mode) {
    case "collapsed-no-content":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;</span>
          {nodeName}
          {attributes}
          <span className={styles.HTMLBracket}> /&gt;</span>
        </span>
      );
    case "collapsed-with-content":
      return (
        <>
          <span className={styles.HTMLTag}>
            <span className={styles.HTMLBracket}>&lt;</span>
            {nodeName}
            {attributes}
            <span className={styles.HTMLBracket}>&gt;</span>
          </span>
          …
          <span className={styles.HTMLTag}>
            <span className={styles.HTMLBracket}>&lt;/</span>
            {nodeName}
            <span className={styles.HTMLBracket}>&gt;</span>
          </span>
        </>
      );
    case "head":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;</span>
          {nodeName}
          {attributes}
          <span className={styles.HTMLBracket}>&gt;</span>
        </span>
      );
    case "tail":
      return (
        <span className={styles.HTMLTag}>
          <span className={styles.HTMLBracket}>&lt;/</span>
          {nodeName}
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
      <span className={styles.Separator}>=</span>
      <span
        className={styles.HtmlAttributeValue}
        data-name="HtmlAttributeValue"
        data-selected={focusOn === "value" || undefined}
      >
        "{displayValue}"
      </span>
    </span>
  );
}
