const { createFactory, createElement } = require("react");
const { Provider } = require("react-redux");
const { ThreadFront } = require("protocol/thread");
const { DOCUMENT_TYPE_NODE } = require("devtools/shared/dom-node-constants");
const { HTMLTooltip } = require("devtools/client/shared/widgets/tooltip/HTMLTooltip");
const { setEventTooltip } = require("devtools/client/shared/widgets/tooltip/EventTooltipHelper");

const {
  updateNodeExpanded,
  updateRootNode,
  updateSelectedNode,
  updateTree,
} = require("./actions/markup");

const MarkupApp = createFactory(require("./components/MarkupApp"));

const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

class MarkupView {
  constructor(inspector) {
    this.inspector = inspector;
    this.selection = inspector.selection;
    this.store = inspector.store;
    this.toolbox = inspector.toolbox;

    // A map containing currently seen NodeFront objects in the markup tree.
    // For a given NodeFront's object id, returns the NodeFront associated with it.
    this.nodes = new Map();
    // An object representing the markup tree. The key to the object represents the object
    // ID of a NodeFront of a given node. The value of each item in the object contains
    // an object representing the properties of the given node.
    this.tree = {};

    this.onSelectNode = this.onSelectNode.bind(this);
    this.onShowEventTooltip = this.onShowEventTooltip.bind(this);
    this.onToggleNodeExpanded = this.onToggleNodeExpanded.bind(this);
    this.update = this.update.bind(this);

    this.inspector.sidebar.on("markupview-selected", this.update);
    this.selection.on("new-node-front", this.update);

    this.init();
  }

  init() {
    if (!this.inspector) {
      return;
    }

    const markupApp = MarkupApp({
      onSelectNode: this.onSelectNode,
      onShowEventTooltip: this.onShowEventTooltip,
      onToggleNodeExpanded: this.onToggleNodeExpanded,
    });

    const provider = createElement(
      Provider,
      {
        id: "markupview",
        key: "markupview",
        store: this.store,
        title: INSPECTOR_L10N.getStr("inspector.panelLabel.markupView"),
      },
      markupApp
    );

    // Expose the provider to let inspector.js use it in setupSidebar.
    this.provider = provider;
  }

  destroy() {
    this.inspector.sidebar.off("markupview-selected", this.update);
    this.selection.off("new-node-front", this.update);

    if (this._eventTooltip) {
      this._eventTooltip.destroy();
      this._eventTooltip = null;
    }

    this.inspector = null;
    this.nodes = null;
    this.selection = null;
    this.store = null;
    this.toolbox = null;
    this.tree = null;
  }

  get eventTooltip() {
    if (!this._eventTooltip) {
      this._eventTooltip = new HTMLTooltip(this.toolbox.doc, {
        type: "arrow",
        consumeOutsideClicks: false,
      });
    }

    return this._eventTooltip;
  }

  /**
   * Given the NodeFront, add a representation of the node's properties to the
   * markup tree object.
   *
   * @param  {NodeFront} node
   *         The NodeFront of the node to add to the markup tree.
   * @param  {Boolean} isExpanded
   *         Whether or not the node is expanded.
   */
  async addNodeToTree(node, { isExpanded = false } = {}) {
    const parentNode = node.parentNode();
    const id = node.objectId();

    this.tree[id] = {
      // A list of the node's attributes.
      attributes: node.attributes,
      // Array of child node object ids.
      children: [],
      // The display name for the UI. This is either the lower casee of the node's tag
      // name or the doctype string for a document type node.
      displayName: node.nodeType === DOCUMENT_TYPE_NODE ? node.doctypeString : node.displayName,
      // The computed display style property value of the node.
      displayType: node.displayType,
      // Whether or not the node has child nodes.
      hasChildren: node.hasChildren,
      // Whether or not the node has event listeners.
      hasEventListeners: node.hasEventListeners,
      // An unique NodeFront object id.
      id,
      // Whether or not the node is displayed. If a node has the attribute
      // `display: none`, it is not displayed (faded in the markup view).
      isDisplayed: node.isDisplayed,
      // Whether or not the node is expanded.
      isExpanded,
      // Whether or not the node is an inline text child. NYI
      isInlineTextChild: !!node.inlineTextChild,
      // Whether or not the node is scrollable. NYI
      isScrollable: node.isScrollable,
      // The namespace URI of the node. NYI
      namespaceURI: node.namespaceURI,
      // The object id of the parent node.
      parentNodeId: parentNode?.objectId(),
      // The pseudo element type.
      pseudoType: node.pseudoType,
      // The name of the current node.
      tagName: node.tagName,
      // The node's `nodeType` which identifies what the node is.
      type: node.nodeType,
      // The node's `nodeValue` which identifies the value of the current node.
      value: node.getNodeValue(),
    };
  }

  /**
   * Collapses the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to collapse.
   */
  collapseNode(nodeId) {
    this.store.dispatch(updateNodeExpanded(nodeId, false));
  }

  /**
   * Expands the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to expand.
   */
  async expandNode(nodeId) {
    await this.getChildren(this.nodes.get(nodeId));
    this.tree[nodeId].isExpanded = true;
    this.store.dispatch(updateTree(this.tree));
  }

  /**
   * Helper function to the update() function. Fetches the children and adds them to the
   * markup tree.
   *
   * @param  {NodeFront} node
   *         The NodeFront of the node to fetch the children from.
   */
  async getChildren(node) {
    const children = await node.childNodes();

    this.tree[node.objectId()].children = children.map(child => child.objectId());

    // Adds the children into the tree model. No need to fetch their children yet
    // since they aren't expanded.
    for (const childNodeFront of children) {
      const childNodeId = childNodeFront.objectId();
      if (!this.nodes.has(childNodeId)) {
        this.nodes.set(childNodeId, childNodeFront);
      }

      if (!this.tree[childNodeId]) {
        await this.addNodeToTree(childNodeFront);
      }
    }
  }

  /**
   * Returns true if the markup panel is visisble, and false otherwise.
   */
  isPanelVisible() {
    return this.inspector?.sidebar?.getCurrentTabID() === "markupview";
  }

  /**
   * Import the selected node and import all of its ancestor nodes to construct the
   * markup tree representation.
   *
   * @param  {NodeFront} node
   *         The selected NodeFront in the markup tree.
   */
  async importNode(node) {
    let currentNode = node;

    // Walk up the parent of the selected node to make sure they are known and expanded
    // starting from the selected node itself since we want to display it expanded with
    // its children visible.
    while (currentNode) {
      if (this.nodes.has(currentNode.objectId())) {
        // We can stop importing once we encounter a node that is already known.
        break;
      }

      this.nodes.set(currentNode.objectId(), currentNode);
      await this.addNodeToTree(currentNode, { isExpanded: true });
      await this.getChildren(currentNode);

      // Walk up the parent nodes until the known root node.
      if (currentNode === ThreadFront.getKnownRootDOMNode()) {
        break;
      }

      currentNode = currentNode.parentNode();
    }
  }

  /**
   * Selects the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to select.
   */
  onSelectNode(nodeId) {
    this.store.dispatch(updateSelectedNode(nodeId));
  }

  /**
   * Shows the event tooltip for the given node.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to show the event tooltip.
   * @param  {DOMNode} target
   *         The anchor element for the tooltip.
   */
  async onShowEventTooltip(nodeId, target) {
    const nodeFront = this.nodes.get(nodeId);
    const listenerRaw = nodeFront.getEventListeners();
    const frameworkListeners = await nodeFront.getFrameworkEventListeners();

    const listenerInfo = [...listenerRaw, ...frameworkListeners].map(listener => {
      const { handler, type, capture, tags = "" } = listener;
      const location = handler.functionLocation();
      const url = handler.functionLocationURL();
      let origin, line, column;

      if (location && url) {
        line = location.line;
        column = location.column;
        origin = `${url}:${line}:${column}`;
      } else {
        // We end up here for DOM0 handlers...
        origin = "[native code]";
      }

      return {
        capturing: capture,
        DOM0: false,
        type,
        origin,
        url,
        line,
        column,
        tags,
        handler,
        scriptId: url ? location.scriptId : undefined,
        native: !url,
        hide: {
          debugger: !url,
        },
      };
    });

    setEventTooltip(this.eventTooltip, listenerInfo, this.toolbox);
    this.eventTooltip.show(target);
  }

  /**
   * Expands or collapses the given node based on whether or not the node is expanded.
   * Expands the given node if the node is not expanded and vice versa.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to expand or collapse.
   * @param  {Boolean} isExpanded
   *         Whether or not the node is expanded.
   */
  onToggleNodeExpanded(nodeId, isExpanded) {
    if (isExpanded) {
      this.collapseNode(nodeId);
    } else {
      this.expandNode(nodeId);
    }

    this.store.dispatch(updateSelectedNode(nodeId));
  }

  /**
   * Updates the markup tree baseed on the current node selection.
   */
  async update() {
    if (!this.isPanelVisible() || !this.selection.isNode()) {
      return;
    }

    await this.importNode(this.selection.nodeFront);

    this.store.dispatch(updateTree(this.tree));
    this.store.dispatch(updateRootNode(ThreadFront.getKnownRootDOMNode().objectId()));
    this.store.dispatch(updateSelectedNode(this.selection.nodeFront.objectId()));
  }
}

module.exports = MarkupView;
