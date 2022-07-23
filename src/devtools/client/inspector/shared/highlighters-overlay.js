/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("devtools/shared/services");
const EventEmitter = require("devtools/shared/event-emitter");
const {
  VIEW_NODE_VALUE_TYPE,
  VIEW_NODE_SHAPE_POINT_TYPE,
} = require("devtools/client/inspector/shared/node-types");

const DEFAULT_HIGHLIGHTER_COLOR = "#9400FF";
const SUBGRID_PARENT_ALPHA = 0.5;

/**
 * Highlighters overlay is a singleton managing all highlighters in the Inspector.
 */
class HighlightersOverlay {
  /**
   * @param  {Inspector} inspector
   *         Inspector toolbox panel.
   */
  constructor(inspector) {
    this.inspector = inspector;
    this.inspectorFront = this.inspector.inspectorFront;
    this.store = this.inspector.store;
    this.target = this.inspector.currentTarget;
    this.telemetry = this.inspector.telemetry;
    this.walker = this.inspector.walker;
    this.maxGridHighlighters = Services.prefs.getIntPref("devtools.gridinspector.maxHighlighters");

    // Collection of instantiated highlighter actors like FlexboxHighlighter,
    // ShapesHighlighter and GeometryEditorHighlighter.
    this.highlighters = {};

    // Array of reusable grid highlighters that have been instantiated and are not
    // associated with any NodeFront.
    this.extraGridHighlighterPool = [];

    // Boolean flag to keep track of whether or not the telemetry timer for the grid
    // highlighter active time is active. We keep track of this to avoid re-starting a
    // new timer when an additional grid highlighter is turned on.
    this.isGridHighlighterTimerActive = false;

    // Collection of instantiated in-context editors, like ShapesInContextEditor, which
    // behave like highlighters but with added editing capabilities that need to map value
    // changes to properties in the Rule view.
    this.editors = {};

    // Saved state to be restore on page navigation.
    this.state = {
      flexbox: {},
      // Map of grid container NodeFront to the their stored grid options
      grids: new Map(),
      shapes: {},
    };

    // NodeFront of the flexbox container that is highlighted.
    this.flexboxHighlighterShown = null;
    // NodeFront of the flex item that is highlighted.
    this.flexItemHighlighterShown = null;
    // NodeFront of element that is highlighted by the geometry editor.
    this.geometryEditorHighlighterShown = null;
    // Name of the highlighter shown on mouse hover.
    this.hoveredHighlighterShown = null;
    // Name of the selector highlighter shown.
    this.selectorHighlighterShown = null;
    // NodeFront of the shape that is highlighted
    this.shapesHighlighterShown = null;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onWillNavigate = this.onWillNavigate.bind(this);

    EventEmitter.decorate(this);
  }

  /**
   * Returns whether `node` is somewhere inside the DOM of the rule view.
   *
   * @param {DOMNode} node
   * @return {Boolean}
   */
  isRuleView(node) {
    return !!node.closest("#ruleview-panel");
  }

  /**
   * Add the highlighters overlay to the view. This will start tracking mouse events
   * and display highlighters when needed.
   *
   * @param  {CssRuleView|CssComputedView|LayoutView} view
   *         Either the rule-view or computed-view panel to add the highlighters overlay.
   */
  addToView(view) {
    const el = view.element;
    el.addEventListener("click", this.onClick, true);
    el.addEventListener("mousemove", this.onMouseMove);
    el.addEventListener("mouseout", this.onMouseOut);
    el.ownerDocument.defaultView.addEventListener("mouseout", this.onMouseOut);
  }

  /**
   * Remove the overlay from the given view. This will stop tracking mouse movement and
   * showing highlighters.
   *
   * @param  {CssRuleView|CssComputedView|LayoutView} view
   *         Either the rule-view or computed-view panel to remove the highlighters
   *         overlay.
   */
  removeFromView(view) {
    const el = view.element;
    el.removeEventListener("click", this.onClick, true);
    el.removeEventListener("mousemove", this.onMouseMove);
    el.removeEventListener("mouseout", this.onMouseOut);
  }

  /**
   * Show the box model highlighter for the given node.
   *
   * @param  {NodeFront} node
   *         The NodeFront of the element to highlight.
   * @param  {Object} options
   *         Object used for passing options to the box model highlighter.
   */
  async showBoxModelHighlighter(node, options) {
    const highlighter = await this._getHighlighter("BoxModelHighlighter");
    if (!highlighter) {
      return;
    }

    const isShown = await highlighter.show(node, options);
    if (!isShown) {
      return;
    }

    this.boxModelHighlighterShown = node;
    this.emit("box-model-highlighter-shown", node);
  }

  /**
   * Hide the box model highlighter.
   */
  async hideBoxModelHighlighter() {
    if (!this.boxModelHighlighterShown || !this.highlighters.BoxModelHighlighter) {
      return;
    }

    await this.highlighters.BoxModelHighlighter.hide();
    const node = this.boxModelHighlighterShown;
    this.boxModelHighlighterShown = null;
    this.emit("box-model-highlighter-hidden", node);
  }

  /**
   * Get a highlighter front given a type. It will only be initialized once.
   *
   * @param  {String} type
   *         The highlighter type. One of this.highlighters.
   * @return {Promise} that resolves to the highlighter
   */
  async _getHighlighter(type) {
    if (this.highlighters[type]) {
      return this.highlighters[type];
    }

    let highlighter;

    try {
      highlighter = await this.inspectorFront.getHighlighterByType(type);
    } catch (e) {
      this._handleRejection(e);
    }

    if (!highlighter) {
      return null;
    }

    this.highlighters[type] = highlighter;
    return highlighter;
  }

  _handleRejection(error) {
    if (!this.destroyed) {
      console.error(error);
    }
  }

  /**
   * Hide the currently shown hovered highlighter.
   */
  _hideHoveredHighlighter() {
    if (!this.hoveredHighlighterShown || !this.highlighters[this.hoveredHighlighterShown]) {
      return;
    }

    // For some reason, the call to highlighter.hide doesn't always return a
    // promise. This causes some tests to fail when trying to install a
    // rejection handler on the result of the call. To avoid this, check
    // whether the result is truthy before installing the handler.
    const onHidden = this.highlighters[this.hoveredHighlighterShown].hide();
    if (onHidden) {
      onHidden.catch(console.error);
    }

    this.hoveredHighlighterShown = null;
    this.emit("highlighter-hidden");
  }

  /**
   * Given a node front and a function that hides the given node's highlighter, hides
   * the highlighter if the node front is no longer in the DOM tree. This is called
   * from the "markupmutation" event handler.
   *
   * @param  {NodeFront} node
   *         The NodeFront of a highlighted DOM node.
   * @param  {Function} hideHighlighter
   *         The function that will hide the highlighter of the highlighted node.
   */
  async _hideHighlighterIfDeadNode(node, hideHighlighter) {
    if (!node) {
      return;
    }

    try {
      const isInTree = node.walkerFront && (await node.walkerFront.isInDOMTree(node));
      if (!isInTree) {
        hideHighlighter(node);
      }
    } catch (e) {
      this._handleRejection(e);
    }
  }

  /**
   * Is the current hovered node a css transform property value in the
   * computed-view.
   *
   * @param  {Object} nodeInfo
   * @return {Boolean}
   */
  _isComputedViewTransform(nodeInfo) {
    if (nodeInfo.view != "computed") {
      return false;
    }
    return nodeInfo.type === VIEW_NODE_VALUE_TYPE && nodeInfo.value.property === "transform";
  }

  /**
   * Is the current clicked node a flex display property value in the
   * rule-view.
   *
   * @param  {DOMNode} node
   * @return {Boolean}
   */
  _isRuleViewDisplayFlex(node) {
    return this.isRuleView(node) && node.classList.contains("ruleview-flex");
  }

  /**
   * Is the current clicked node a grid display property value in the
   * rule-view.
   *
   * @param  {DOMNode} node
   * @return {Boolean}
   */
  _isRuleViewDisplayGrid(node) {
    return this.isRuleView(node) && node.classList.contains("ruleview-grid");
  }

  /**
   * Does the current clicked node have the shapes highlighter toggle in the
   * rule-view.
   *
   * @param  {DOMNode} node
   * @return {Boolean}
   */
  _isRuleViewShapeSwatch(node) {
    return this.isRuleView(node) && node.classList.contains("ruleview-shapeswatch");
  }

  /**
   * Is the current hovered node a css transform property value in the rule-view.
   *
   * @param  {Object} nodeInfo
   * @return {Boolean}
   */
  _isRuleViewTransform(nodeInfo) {
    if (nodeInfo.view != "rule") {
      return false;
    }
    const isTransform =
      nodeInfo.type === VIEW_NODE_VALUE_TYPE && nodeInfo.value.property === "transform";
    const isEnabled =
      nodeInfo.value.enabled && !nodeInfo.value.overridden && !nodeInfo.value.pseudoElement;
    return isTransform && isEnabled;
  }

  onMouseMove(event) {
    // Bail out if the target is the same as for the last mousemove.
    if (event.target === this._lastHovered) {
      return;
    }

    // Only one highlighter can be displayed at a time, hide the currently shown.
    this._hideHoveredHighlighter();

    this._lastHovered = event.target;

    const view = this.isRuleView(this._lastHovered)
      ? this.inspector.getPanel("ruleview").view
      : this.inspector.getPanel("computedview").computedView;
    const nodeInfo = view.getNodeInfo(event.target);
    if (!nodeInfo) {
      return;
    }

    // Choose the type of highlighter required for the hovered node.
    let type;
    if (this._isRuleViewTransform(nodeInfo) || this._isComputedViewTransform(nodeInfo)) {
      type = "CssTransformHighlighter";
    }

    if (type) {
      this.hoveredHighlighterShown = type;
      const node = this.inspector.selection.nodeFront;
      this._getHighlighter(type)
        .then(highlighter => highlighter.show(node))
        .then(shown => {
          if (shown) {
            this.emit("highlighter-shown");
          }
        });
    }
  }

  onMouseOut(event) {
    // Only hide the highlighter if the mouse leaves the currently hovered node.
    if (!this._lastHovered || (event && this._lastHovered.contains(event.relatedTarget))) {
      return;
    }

    // Otherwise, hide the highlighter.
    const view = this.isRuleView(this._lastHovered)
      ? this.inspector.getPanel("ruleview").view
      : this.inspector.getPanel("computedview").computedView;

    this._lastHovered = null;
    this._hideHoveredHighlighter();
  }

  /**
   * Destroy and clean-up all instances of in-context editors.
   */
  destroyEditors() {
    for (const type in this.editors) {
      this.editors[type].off("show");
      this.editors[type].off("hide");
      this.editors[type].destroy();
    }

    this.editors = {};
  }

  /**
   * Destroy and clean-up all instances of highlighters.
   */
  destroyHighlighters() {
    for (const type in this.highlighters) {
      if (this.highlighters[type]) {
        this.highlighters[type].finalize();
        this.highlighters[type] = null;
      }
    }

    this.highlighters = null;
  }

  /**
   * Destroy this overlay instance, removing it from the view and destroying
   * all initialized highlighters.
   */
  destroy() {
    this.destroyEditors();
    this.destroyHighlighters();

    this._canGetParentGridNode = null;
    this._lastHovered = null;

    this.inspector = null;
    this.inspectorFront = null;
    this.state = null;
    this.store = null;
    this.target = null;
    this.telemetry = null;
    this.walker = null;

    this.boxModelHighlighterShown = null;
    this.selectorHighlighterShown = null;

    this.destroyed = true;
  }
}

module.exports = HighlightersOverlay;
