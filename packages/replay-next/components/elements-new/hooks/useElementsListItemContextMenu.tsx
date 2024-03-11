import { PauseId } from "@replayio/protocol";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import { ElementsListData } from "replay-next/components/elements-new/ElementsListData";
import { Item } from "replay-next/components/elements-new/types";
import { elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import Icon from "replay-next/components/Icon";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { ReplayClientInterface } from "shared/client/types";

import styles from "../ElementsListItem.module.css";

export function useElementsListItemContextMenu({
  elementsListData,
  item,
  pauseId,
  replayClient,
}: {
  elementsListData: ElementsListData;
  item: Item;
  pauseId: PauseId;
  replayClient: ReplayClientInterface;
}) {
  const copyElement = async () => {
    let string;

    const { node } = await elementCache.readAsync(replayClient, pauseId, item.objectId);

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

        const attributes = node.attributes?.map(({ name, value }) => `${name}="${value}"`) ?? [];

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

  const hasChildren = item.displayMode !== "empty";
  const isExpanded = hasChildren && item.displayMode !== "collapsed";

  const toggleNode = () => {
    elementsListData.toggleNodeExpanded(item.objectId, !isExpanded);
  };

  return useContextMenu(
    <>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={copyElement}>
        <>
          <Icon type="copy" />
          Copy
        </>
      </ContextMenuItem>
      {item.displayMode !== "empty" && (
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
