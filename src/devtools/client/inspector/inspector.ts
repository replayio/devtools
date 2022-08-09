/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// "use strict";

import EventEmitter from "devtools/shared/event-emitter";
import { NodeFront } from "protocol/thread/node";
import { assert } from "protocol/utils";
import { UIStore } from "ui/actions";

import { selection, Selection } from "devtools/client/framework/selection";

import Highlighter from "highlighter/highlighter";

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

/**
 * Represents an open instance of the Inspector for a tab.
 * The inspector controls the breadcrumbs, the markup view, and the sidebar
 * (computed view, rule view, font view and animation inspector).
 */
export class Inspector {
  store: UIStore | null;
  highlighter: typeof Highlighter;

  selection: Selection;

  private _highlighters?: any;
  private _destroyed?: boolean;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<InspectorEvent, ((value?: any) => void)[]>;
  on!: (name: InspectorEvent, handler: (value?: any) => void) => void;
  off!: (name: InspectorEvent, handler: (value?: any) => void) => void;
  emit!: (name: InspectorEvent, value?: any) => void;

  constructor() {
    EventEmitter.decorate(this);

    this.selection = selection;

    (window as any).inspector = this;
    this.store = (window as any).app.store;

    this.highlighter = Highlighter;
  }

  getHighlighter() {
    return Highlighter;
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

    (window as any).inspector = null;
    this.store = null;
  }

  /**
   * Returns an object containing the shared handler functions used in the box
   * model and grid React components.
   */
  getCommonComponentProps() {
    assert(this.selection, "selection object not found");

    return {
      setSelectedNode: this.selection.setNodeFront,
    };
  }
}
