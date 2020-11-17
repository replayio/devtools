const { createFactory, createElement } = require("react");
const { Provider } = require("react-redux");
const { ThreadFront } = require("protocol/thread");
const { HTMLTooltip } = require("devtools/client/shared/widgets/tooltip/HTMLTooltip");
const { setEventTooltip } = require("devtools/client/shared/widgets/tooltip/EventTooltipHelper");
const Highlighter = require("highlighter/highlighter.js");

const {
  reset,
  newRoot,
  expandNode,
  updateNodeExpanded,
  selectionChanged,
} = require("./actions/markup");

const MarkupApp = createFactory(require("./components/MarkupApp"));

const { features } = require("../prefs");
const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

class MarkupView {
  constructor(inspector) {
    this.inspector = inspector;
    this.selection = inspector.selection;
    this.store = inspector.store;
    this.toolbox = inspector.toolbox;

    this.hoveredNodeId = undefined;

    this.onSelectNode = this.onSelectNode.bind(this);
    this.onShowEventTooltip = this.onShowEventTooltip.bind(this);
    this.onToggleNodeExpanded = this.onToggleNodeExpanded.bind(this);
    this.onMouseEnterNode = this.onMouseEnterNode.bind(this);
    this.onMouseLeaveNode = this.onMouseLeaveNode.bind(this);
    this.onPaused = this.onPaused.bind(this);
    this.onResumed = this.onResumed.bind(this);
    this.update = this.update.bind(this);

    ThreadFront.on("paused", this.onPaused);
    ThreadFront.on("resumed", this.onResumed);
    this.selection.on("new-node-front", this.update);

    this.init();
  }

  async init() {
    if (!this.inspector) {
      return;
    }

    const markupApp = MarkupApp({
      onSelectNode: this.onSelectNode,
      onShowEventTooltip: this.onShowEventTooltip,
      onToggleNodeExpanded: this.onToggleNodeExpanded,
      onMouseEnterNode: this.onMouseEnterNode,
      onMouseLeaveNode: this.onMouseLeaveNode,
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

    if (ThreadFront.currentPause) {
      await this.onPaused();
    } else {
      this.onResumed();
    }
  }

  async onPaused() {
    this.store.dispatch(reset());

    ThreadFront.ensureCurrentPause();
    const pause = ThreadFront.currentPause;
    if (this.selection.nodeFront && this.selection.nodeFront.pause !== pause) {
      this.selection.setNodeFront(null);
    }

    const rootNode = await ThreadFront.getRootDOMNode();
    await rootNode?.ensureLoaded();
    if (!rootNode || ThreadFront.currentPause !== pause) {
      return;
    }
    this.store.dispatch(newRoot(rootNode));

    if (this.selection.nodeFront) {
      this.store.dispatch(selectionChanged(this.selection, false));
    } else {
      const defaultNode = await rootNode.querySelector("body");
      await defaultNode?.ensureLoaded();
      if (defaultNode && !this.selection.nodeFront && ThreadFront.currentPause === pause) {
        this.selection.setNodeFront(defaultNode, { reason: "navigateaway" });
      }
    }
  }

  onResumed() {
    this.selection.setNodeFront(null);
    this.store.dispatch(reset());
  }

  destroy() {
    // this.inspector.sidebar.off("markupview-selected", this.update);
    this.selection.off("new-node-front", this.update);

    if (this._eventTooltip) {
      this._eventTooltip.destroy();
      this._eventTooltip = null;
    }

    this.inspector = null;
    this.selection = null;
    this.store = null;
    this.toolbox = null;
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
    this.store?.dispatch(expandNode(nodeId));
  }

  /**
   * Returns true if the markup panel is visisble, and false otherwise.
   */
  isPanelVisible() {
    if (features.oldMarkupView) {
      return this.inspector?.sidebar?.getCurrentTabID() === "markupview";
    } else {
      return this.inspector?.toolbox?.currentTool === "inspector";
    }
  }

  /**
   * Selects the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to select.
   */
  onSelectNode(nodeId) {
    this.selection.setNodeFront(ThreadFront.currentPause.getNodeFront(nodeId), {
      reason: "markup",
    });
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
    const nodeFront = ThreadFront.currentPause.getNodeFront(nodeId);
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
        sourceId: url ? location.sourceId : undefined,
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

    this.selection.setNodeFront(ThreadFront.currentPause.getNodeFront(nodeId));
  }

  onMouseEnterNode(nodeId) {
    if (this.hoveredNodeId !== nodeId) {
      this.hoveredNodeId = nodeId;
      Highlighter.highlight(ThreadFront.currentPause.getNodeFront(nodeId));
    }
  }

  onMouseLeaveNode(nodeId) {
    if (this.hoveredNodeId === nodeId) {
      this.hoveredNodeId = undefined;
      Highlighter.unhighlight();
    }
  }

  /**
   * Updates the markup tree based on the current node selection.
   */
  async update(_, reason) {
    if (!this.isPanelVisible() || !this.selection.isNode()) {
      return;
    }

    this.store?.dispatch(
      selectionChanged(this.selection, reason === "navigateaway", reason !== "markup")
    );
  }
}

module.exports = MarkupView;
