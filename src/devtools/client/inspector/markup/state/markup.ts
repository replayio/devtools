import { Attr } from "@recordreplay/protocol";
import { NodeFront } from "protocol/thread/node";

export interface NodeInfo {
  // A list of the node's attributes.
  attributes: Attr[];
  // Array of child node object ids.
  children: string[];
  // The display name for the UI. This is either the lower casee of the node's tag
  // name or the doctype string for a document type node.
  displayName: string;
  // The computed display style property value of the node.
  displayType: string | undefined;
  // Whether or not the node has child nodes.
  hasChildren: boolean;
  // Whether or not the node has event listeners.
  hasEventListeners: boolean;
  // An unique NodeFront object id.
  id: string;
  // Whether or not the node is displayed. If a node has the attribute
  // `display: none`, it is not displayed (faded in the markup view).
  isDisplayed: boolean;
  // Whether or not the node is expanded.
  isExpanded: boolean;
  // Whether or not the node is an inline text child. NYI
  isInlineTextChild: boolean;
  // Whether or not the node is scrollable. NYI
  isScrollable: boolean;
  // The namespace URI of the node. NYI
  namespaceURI: string;
  // The object id of the parent node.
  parentNodeId: string | undefined;
  // The pseudo element type.
  pseudoType: NodeFront["pseudoType"];
  // The name of the current node.
  tagName: string | undefined;
  // The node's `nodeType` which identifies what the node is.
  type: number;
  // The node's `nodeValue` which identifies the value of the current node.
  value: string | undefined;
  // Whether this node's children are being loaded
  isLoadingChildren: boolean;
}

export type MarkupTree = { [key: string]: NodeInfo | undefined };

export interface MarkupState {
  // Whether or not to collapse the attributes for nodes.
  collapseAttributes: boolean;
  // The max length of the attribute value prior to truncating the attributes.
  collapseAttributeLength: number;
  // The root node to display in the DOM view.
  rootNode: string | null;
  // The selected node to display in the DOM view.
  selectedNode: string | null;
  // A node that should be scrolled into view.
  scrollIntoViewNode: string | null;
  // An object representing the markup tree. The key to the object represents the object
  // ID of a NodeFront of a given node. The value of each item in the object contains
  // an object representing the properties of the given node.
  tree: MarkupTree;
}
