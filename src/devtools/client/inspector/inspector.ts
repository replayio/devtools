/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// "use strict";

import EventEmitter from "devtools/shared/event-emitter";
import { NodeFront } from "protocol/thread/node";
import { assert } from "protocol/utils";
import { UIStore } from "ui/actions";

import MarkupView from "devtools/client/inspector/markup/markup";
import BoxModel from "devtools/client/inspector/boxmodel/box-model";
import HighlightersOverlay from "devtools/client/inspector/shared/highlighters-overlay";

import CSSProperties from "./css-properties";
import RulesView from "./rules/rules";

import Highlighter from "highlighter/highlighter";
import { DevToolsToolbox } from "ui/utils/devtools-toolbox";

/**
 * Represents an open instance of the Inspector for a tab.
 * The inspector controls the breadcrumbs, the markup view, and the sidebar
 * (computed view, rule view, font view and animation inspector).
 */

type InspectorEvent =
  | "ready" // Fired when the inspector panel is opened for the first time and ready to use
  | "new-root" // Fired after a new root (navigation to a new page) event was fired by the walker, and taken into account by the inspector (after the markup view has been reloaded)
  | "breadcrumbs-updated" // Fired when the breadcrumb widget updates to a new node
  | "boxmodel-view-updated" // Fired when the box model updates to a new node
  | "markupmutation" // Fired after markup mutations have been processed by the markup-view
  | "computed-view-refreshed" // Fired when the computed rules view updates to a new node
  | "computed-view-property-expanded" // Fired when a property is expanded in the computed rules view
  | "computed-view-property-collapsed" // Fired when a property is collapsed in the computed rules view
  | "computed-view-sourcelinks-updated" // Fired when the stylesheet source links have been updated (when switching to source-mapped files)
  | "rule-view-refreshed" // Fired when the rule view updates to a new node
  | "rule-view-sourcelinks-updated"; // Fired when the stylesheet source links have been updated (when switching to source-mapped files)
export class Inspector {
  panelDoc: Document | null;
  panelWin: Window | null;
  store: UIStore | null;
  highlighter: typeof Highlighter;

  markup: MarkupView;
  rules: RulesView;
  boxModel: BoxModel;

  private _toolbox: DevToolsToolbox | null;
  private _highlighters?: any;
  private _destroyed?: boolean;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<InspectorEvent, ((value?: any) => void)[]>;
  on!: (name: InspectorEvent, handler: (value?: any) => void) => void;
  off!: (name: InspectorEvent, handler: (value?: any) => void) => void;
  emit!: (name: InspectorEvent, value?: any) => void;

  constructor(toolbox: DevToolsToolbox) {
    EventEmitter.decorate(this);

    this._toolbox = toolbox;
    this.panelDoc = window.document;
    this.panelWin = window;
    (this.panelWin as any).inspector = this;
    this.store = (window as any).app.store;

    this.highlighter = Highlighter;

    this.markup = new MarkupView(this);
    this.rules = new RulesView(this, window);
    this.boxModel = new BoxModel(this, window);
  }

  get toolbox() {
    return this._toolbox;
  }

  get highlighters() {
    if (!this._highlighters) {
      this._highlighters = new HighlightersOverlay(this);
    }

    return this._highlighters;
  }

  get selection() {
    return this.toolbox ? this.toolbox.selection : null;
  }

  get cssProperties() {
    return CSSProperties;
  }

  get selectionCssSelector() {
    return null;
  }

  /**
   * Destroy the inspector.
   */
  destroy() {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;

    if (this._highlighters) {
      this._highlighters.destroy();
      this._highlighters = null;
    }

    this._toolbox = null;
    this.panelDoc = null;
    (this.panelWin as any).inspector = null;
    this.panelWin = null;
    this.store = null;
  }

  /**
   * Returns an object containing the shared handler functions used in the box
   * model and grid React components.
   */
  getCommonComponentProps() {
    assert(this.selection);

    return {
      setSelectedNode: this.selection.setNodeFront,
      onShowBoxModelHighlighterForNode: this.onShowBoxModelHighlighterForNode,
    };
  }

  /**
   * Shows the box-model highlighter on the element corresponding to the provided
   * NodeFront.
   *
   * @param  {NodeFront} nodeFront
   *         The node to highlight.
   * @param  {Object} options
   *         Options passed to the highlighter actor.
   */
  onShowBoxModelHighlighterForNode = (nodeFront: NodeFront, options: any) => {
    // nodeFront.highlighterFront.highlight(nodeFront, options);
  };
}
