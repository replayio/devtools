const { ThreadFront } = require("protocol/thread");
const { HTMLTooltip } = require("devtools/client/shared/widgets/tooltip/HTMLTooltip");
const Highlighter = require("highlighter/highlighter").default;
const { selectors } = require("ui/reducers");

const {
  reset,
  newRoot,
  expandNode,
  updateNodeExpanded,
  selectionChanged,
} = require("./actions/markup");

class MarkupView {
  constructor(inspector) {
    this.inspector = inspector;
    this.selection = inspector.selection;
    this.store = inspector.store;
    this.toolbox = inspector.toolbox;
    this.isInspectorVisible = false;
    this.isLoadingPostponed = false;
    this.hoveredNodeId = undefined;

    this.onSelectNode = this.onSelectNode.bind(this);
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

    this.updateIsInspectorVisible();
    this.store?.subscribe(this.updateIsInspectorVisible);

    if (ThreadFront.currentPause) {
      await this.onPaused();
    } else {
      this.onResumed();
    }
  }

  updateIsInspectorVisible = () => {
    const visible = selectors.isInspectorSelected(this.store.getState());
    if (visible !== this.isInspectorVisible) {
      this.isInspectorVisible = visible;
      if (this.isInspectorVisible && this.isLoadingPostponed) {
        this.loadNewDocument();
      }
    }
  };

  getMarkupProps() {
    return {
      onSelectNode: this.onSelectNode,
      onToggleNodeExpanded: this.onToggleNodeExpanded,
      onMouseEnterNode: this.onMouseEnterNode,
      onMouseLeaveNode: this.onMouseLeaveNode,
    };
  }

  async onPaused() {
    this.store.dispatch(reset());
    if (this.isInspectorVisible) {
      this.loadNewDocument();
    } else {
      this.isLoadingPostponed = true;
    }
  }

  async loadNewDocument() {
    this.isLoadingPostponed = false;

    await ThreadFront.ensureAllSources();
    ThreadFront.ensureCurrentPause();
    const pause = ThreadFront.currentPause;
    if (this.selection.nodeFront && this.selection.nodeFront.pause !== pause) {
      this.selection.setNodeFront(null);
    }

    await this.store.dispatch(newRoot());
    if (ThreadFront.currentPause !== pause) {
      return;
    }

    if (this.selection.nodeFront) {
      this.store.dispatch(selectionChanged(this.selection, false));
    } else {
      const rootNode = await ThreadFront.getRootDOMNode();
      const defaultNode = await rootNode.querySelector("body");
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
    if (!this.isInspectorVisible || !this.selection.isNode()) {
      return;
    }

    this.store?.dispatch(
      selectionChanged(this.selection, reason === "navigateaway", reason !== "markup")
    );
  }
}

module.exports = MarkupView;
