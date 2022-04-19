const PropTypes = require("prop-types");

/**
 * An attribute of a Node.
 */
const attribute = (exports.attribute = {
  // The attribute name.
  name: PropTypes.string,

  // The attribute value.
  value: PropTypes.string,
});

exports.markup = {
  // The max length of the attribute value prior to truncating the attributes.
  collapseAttributeLength: PropTypes.number,

  // Whether or not to collapse the attributes for nodes.
  collapseAttributes: PropTypes.bool,

  // The root node to display in the DOM view.
  rootNode: PropTypes.string,

  // The selected node to display in the DOM view.
  selectedNode: PropTypes.string,

  // The markup tree representation of the DOM view.
  tree: PropTypes.object,
};

/**
 * A DOM Node.
 */
exports.node = {
  // A list of the node's attributes.
  attributes: PropTypes.arrayOf(PropTypes.shape(attribute)),

  // Array of child node object ids.
  children: PropTypes.arrayOf(PropTypes.string),

  // The display name for the UI. This is either the lower casee of the node's tag
  // name or the doctype string for a document type node.
  displayName: PropTypes.string,

  // The computed display style property value of the node.
  displayType: PropTypes.string,

  // Whether or not the node has child nodes.
  hasChildren: PropTypes.bool,

  // Whether or not the node has event listeners.
  hasEventListeners: PropTypes.bool,

  // An unique NodeFront object id.
  id: PropTypes.string,

  // Whether or not the node is displayed. If a node has the attribute
  // `display: none`, it is not displayed (faded in the markup view).
  isDisplayed: PropTypes.bool,

  // Whether or not the node is expanded.
  isExpanded: PropTypes.bool,

  // Whether or not the node is an inline text child.
  isInlineTextChild: PropTypes.bool,

  // Whether or not the node is scrollable.
  isScrollable: PropTypes.bool,

  // The namespace URI of the node.
  namespaceURI: PropTypes.string,

  // The object id of the parent node.
  parentNodeId: PropTypes.string,

  // The pseudo element type.
  pseudoType: PropTypes.string,

  // The name of the current node.
  tagName: PropTypes.string,

  // The node's `nodeType` which identifies what the node is.
  type: PropTypes.number,

  // The node's `nodeValue` which identifies the value of the current node.
  value: PropTypes.string,
};
