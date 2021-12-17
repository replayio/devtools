import Selection, { NodeSelectionReason } from "devtools/client/framework/selection";
import { Inspector } from "../inspector";

import { ThreadFront } from "protocol/thread";
import { HTMLTooltip } from "devtools/client/shared/widgets/tooltip/HTMLTooltip";
import Highlighter from "highlighter/highlighter";
import { selectors } from "ui/reducers";
import { UIStore } from "ui/actions";
import { DevToolsToolbox } from "ui/utils/devtools-toolbox";

import { reset, newRoot, expandNode, updateNodeExpanded, selectionChanged } from "./actions/markup";
import { assert } from "protocol/utils";

class MarkupView {
  inspector: Inspector | null;
  selection: Selection | null;
  store: UIStore | null;
  toolbox: DevToolsToolbox | null;
  isInspectorVisible: boolean;
  isLoadingPostponed: boolean;
  hoveredNodeId: string | undefined;
  _eventTooltip: HTMLTooltip | null;

  constructor(inspector: Inspector) {
    assert(inspector.selection);

    this.inspector = inspector;
    this.selection = inspector.selection;
    this.store = inspector.store;
    this.toolbox = inspector.toolbox;
    this.isInspectorVisible = false;
    this.isLoadingPostponed = false;
    this.hoveredNodeId = undefined;
    this._eventTooltip = null;

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
    if (!this.store) {
      return;
    }

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
    assert(this.store);

    this.store.dispatch(reset());
    if (this.isInspectorVisible) {
      this.loadNewDocument();
    } else {
      this.isLoadingPostponed = true;
    }
  }

  async loadNewDocument() {
    assert(this.store);
    assert(this.selection);

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

      if (!rootNode) {
        return;
      }

      const defaultNode = await rootNode.querySelector("body");
      if (defaultNode && !this.selection.nodeFront && ThreadFront.currentPause === pause) {
        this.selection.setNodeFront(defaultNode, { reason: "navigateaway" });
      }
    }
  }

  onResumed() {
    assert(this.store);
    assert(this.selection);

    this.selection.setNodeFront(null);
    this.store.dispatch(reset());
  }

  destroy() {
    assert(this.selection);

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
      this._eventTooltip = new HTMLTooltip({
        // @ts-ignore
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
  collapseNode(nodeId: string) {
    this.store?.dispatch(updateNodeExpanded(nodeId, false));
  }

  /**
   * Expands the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to expand.
   */
  async expandNode(nodeId: string) {
    this.store?.dispatch(expandNode(nodeId));
  }

  /**
   * Selects the given node in the markup tree.
   *
   * @param  {String} nodeId
   *         The NodeFront object id to select.
   */
  onSelectNode(nodeId: string) {
    assert(ThreadFront.currentPause);

    this.selection?.setNodeFront(ThreadFront.currentPause.getNodeFront(nodeId), {
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
  onToggleNodeExpanded(nodeId: string, isExpanded: boolean) {
    assert(ThreadFront.currentPause);

    if (isExpanded) {
      this.collapseNode(nodeId);
    } else {
      this.expandNode(nodeId);
    }

    this.selection?.setNodeFront(ThreadFront.currentPause.getNodeFront(nodeId));
  }

  onMouseEnterNode(nodeId: string) {
    assert(ThreadFront.currentPause);

    if (this.hoveredNodeId !== nodeId) {
      this.hoveredNodeId = nodeId;
      Highlighter.highlight(ThreadFront.currentPause.getNodeFront(nodeId));
    }
  }

  onMouseLeaveNode(nodeId: string) {
    if (this.hoveredNodeId === nodeId) {
      this.hoveredNodeId = undefined;
      Highlighter.unhighlight();
    }
  }

  /**
   * Updates the markup tree based on the current node selection.
   */
  async update(_: any, reason: NodeSelectionReason) {
    if (!this.selection) {
      return;
    }

    if (!this.isInspectorVisible || !this.selection.isNode()) {
      return;
    }

    this.store?.dispatch(
      selectionChanged(this.selection, reason === "navigateaway", reason !== "markup")
    );
  }
}

export default MarkupView;
