import { Node } from "@replayio/protocol";

import { DOM_NODE_CONSTANTS } from "replay-next/components/elements/constants";

export function shouldDisplayNode(node: Node): boolean {
  switch (node.nodeType) {
    case DOM_NODE_CONSTANTS.DOCUMENT_NODE:
      // Don't show the root #document node
      // but we should show e.g. iframe document roots
      return node.parentNode != null;
    case DOM_NODE_CONSTANTS.TEXT_NODE:
      // Don't show whitespace-only text nodes
      return !!node.nodeValue?.trim();
    default:
      return true;
  }
}
