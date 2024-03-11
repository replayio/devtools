import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { ElementsListData } from "replay-next/components/elements-old/ElementsListData";
import { Item } from "replay-next/components/elements-old/types";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";

import styles from "../ElementsListItem.module.css";

export function useElementsListItemContextMenu({
  elementsListData,
  item,
}: {
  elementsListData: ElementsListData;
  item: Item;
}) {
  const { element, id, isExpanded } = item;
  const { filteredChildNodeIds, node } = element;

  const hasChildren = filteredChildNodeIds.length > 0;

  const copyElement = () => {
    let string;

    // IMPORTANT
    // Keep this in sync with the rendering logic in ElementsListItem
    switch (node.nodeType) {
      case Node.COMMENT_NODE: {
        let nodeValue = node.nodeValue ?? "";
        nodeValue = nodeValue.trim();
        nodeValue = nodeValue.replace(/\n\s+/g, " ");

        string = `<!-- ${nodeValue} -->`;
        break;
      }
      case Node.DOCUMENT_NODE: {
        string = node.nodeName;
        break;
      }
      case Node.DOCUMENT_TYPE_NODE: {
        string = `<!DOCTYPE ${node.nodeName}>`;
        break;
      }
      case Node.TEXT_NODE: {
        string = (node.nodeValue ?? "").trim().replace(/[\n\r]/g, "\\n");
        break;
      }
      default: {
        const nodeName = node.nodeName.toLowerCase();

        const attributes =
          element.node.attributes?.map(({ name, value }) => `${name}="${value}"`) ?? [];

        if (attributes.length === 0) {
          string = `<${nodeName}>`;
        } else {
          string = `<${nodeName} ${attributes.join(" ")}>`;
        }
        break;
      }
    }

    copyToClipboard(string);
  };

  const toggleNode = () => {
    elementsListData.toggleNodeExpanded(id, !isExpanded);
  };

  return useContextMenu(
    <>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={copyElement}>
        <>
          <Icon type="copy" />
          Copy
        </>
      </ContextMenuItem>
      {hasChildren && (
        <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={toggleNode}>
          <>
            <Icon className={styles.ExpandCollapseIcon} type={isExpanded ? "collapse" : "expand"} />
            {isExpanded ? "Collapse" : "Expand"}
          </>
        </ContextMenuItem>
      )}
    </>,
    {
      dataTestId: "ConsoleContextMenu",
    }
  );
}
