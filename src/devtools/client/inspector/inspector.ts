/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// "use strict";

// const Services = require("Services");
const EventEmitter = require("devtools/shared/event-emitter");
// const InspectorStyleChangeTracker = require("devtools/client/inspector/shared/style-change-tracker");
// const { log } = require("protocol/socket");
import { NodeFront } from "protocol/thread/node";
import { UIStore } from "ui/actions";
import { extendStore } from "ui/setup/store";
import * as inspectorReducers from "devtools/client/inspector/reducers";

// require("devtools/client/themes/breadcrumbs.css");
// require("devtools/client/themes/inspector.css");
// require("devtools/client/themes/badge.css");
// require("devtools/client/themes/rules.css");
// require("devtools/client/themes/computed.css");
// require("devtools/client/themes/changes.css");
// require("devtools/client/themes/boxmodel.css");
// require("devtools/client/themes/layout.css");
// require("devtools/client/themes/splitters.css");
// require("devtools/client/themes/variables.css");
// require("devtools/client/themes/common.css");
// require("devtools/client/themes/toolbars.css");
// require("devtools/client/themes/tooltips.css");
// require("devtools/client/themes/accessibility-color-contrast.css");
// require("devtools/client/shared/components/tabs/Tabs.css");
// require("devtools/client/shared/components/SidebarToggle.css");
// require("devtools/client/inspector/components/InspectorTabPanel.css");
// require("devtools/client/shared/components/splitter/SplitBox.css");
// require("devtools/client/shared/components/Accordion.css");

import MarkupView from "devtools/client/inspector/markup/markup";
const BoxModel = require("devtools/client/inspector/boxmodel/box-model");
const HighlightersOverlay = require("devtools/client/inspector/shared/highlighters-overlay");

import CSSProperties from "./css-properties";
import RulesView from "./rules/rules";

import Highlighter from "highlighter/highlighter";

/**
 * Represents an open instance of the Inspector for a tab.
 * The inspector controls the breadcrumbs, the markup view, and the sidebar
 * (computed view, rule view, font view and animation inspector).
 *
 * Events:
 * - ready
 *      Fired when the inspector panel is opened for the first time and ready to
 *      use
 * - new-root
 *      Fired after a new root (navigation to a new page) event was fired by
 *      the walker, and taken into account by the inspector (after the markup
 *      view has been reloaded)
 * - breadcrumbs-updated
 *      Fired when the breadcrumb widget updates to a new node
 * - boxmodel-view-updated
 *      Fired when the box model updates to a new node
 * - markupmutation
 *      Fired after markup mutations have been processed by the markup-view
 * - computed-view-refreshed
 *      Fired when the computed rules view updates to a new node
 * - computed-view-property-expanded
 *      Fired when a property is expanded in the computed rules view
 * - computed-view-property-collapsed
 *      Fired when a property is collapsed in the computed rules view
 * - computed-view-sourcelinks-updated
 *      Fired when the stylesheet source links have been updated (when switching
 *      to source-mapped files)
 * - rule-view-refreshed
 *      Fired when the rule view updates to a new node
 * - rule-view-sourcelinks-updated
 *      Fired when the stylesheet source links have been updated (when switching
 *      to source-mapped files)
 */
export class Inspector {
  panelDoc: Document | null;
  panelWin: Window | null;
  store: UIStore | null;
  highlighter: typeof Highlighter;

  markup: MarkupView;
  rules: RulesView;
  boxModel: any;

  private _toolbox: any;
  private _highlighters?: any;
  private _destroyed?: boolean;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<string, ((value?: any) => void)[]>;
  on!: (name: string, handler: (value?: any) => void) => void;
  off!: (name: string, handler: (value?: any) => void) => void;
  emit!: (name: string, value?: any) => void;

  constructor(toolbox: any) {
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
    return this.toolbox.selection;
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
   * Toggle a pseudo class.
   */
  togglePseudoClass(pseudo: any) {
    if (this.selection.isElementNode()) {
      const node = this.selection.nodeFront;
      if (node.hasPseudoClassLock(pseudo)) {
        return node.walkerFront.removePseudoClassLock(node, pseudo, {
          parents: true,
        });
      }

      const hierarchical = pseudo == ":hover" || pseudo == ":active";
      return node.walkerFront.addPseudoClassLock(node, pseudo, {
        parents: hierarchical,
      });
    }
    // return promise.resolve();
  }

  /**
   * Returns an object containing the shared handler functions used in the box
   * model and grid React components.
   */
  getCommonComponentProps() {
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
