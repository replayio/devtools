import { Node as ProtocolNode } from "@replayio/protocol";

export function shouldDisplayNode(node: ProtocolNode): boolean {
  switch (node.nodeType) {
    case Node.DOCUMENT_NODE:
      // Don't show the root #document node
      // but we should show e.g. iframe document roots
      return node.parentNode != null;
    case Node.TEXT_NODE:
      // Don't show whitespace-only text nodes
      return !!node.nodeValue?.trim();
    default:
      return true;
  }
}
