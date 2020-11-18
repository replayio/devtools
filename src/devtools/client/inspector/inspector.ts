/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// "use strict";

// const Services = require("Services");
const EventEmitter = require("devtools/shared/event-emitter");
// const InspectorStyleChangeTracker = require("devtools/client/inspector/shared/style-change-tracker");
// const { log } = require("protocol/socket");
import { ThreadFront } from "protocol/thread";
import { NodeFront } from "protocol/thread/node";
import { UIStore } from "ui/actions";
import { InspectorPanel } from "./components/App";

require("devtools/client/themes/breadcrumbs.css");
require("devtools/client/themes/inspector.css");
require("devtools/client/themes/badge.css");
require("devtools/client/themes/rules.css");
require("devtools/client/themes/computed.css");
require("devtools/client/themes/changes.css");
require("devtools/client/themes/boxmodel.css");
require("devtools/client/themes/layout.css");
require("devtools/client/themes/splitters.css");
require("devtools/client/themes/variables.css");
require("devtools/client/themes/common.css");
require("devtools/client/themes/toolbars.css");
require("devtools/client/themes/tooltips.css");
require("devtools/client/themes/accessibility-color-contrast.css");
require("devtools/client/shared/components/tabs/Tabs.css");
require("devtools/client/shared/components/SidebarToggle.css");
require("devtools/client/inspector/components/InspectorTabPanel.css");
require("devtools/client/shared/components/splitter/SplitBox.css");
require("devtools/client/shared/components/Accordion.css");

const { HTMLBreadcrumbs } = require("devtools/client/inspector/breadcrumbs");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const { InspectorSearch } = require("devtools/client/inspector/inspector-search");

const NewMarkupView = require("devtools/client/inspector/markup/new-markup");
const { ComputedPanel } = require("devtools/client/inspector/computed/panel");
const HighlightersOverlay = require("devtools/client/inspector/shared/highlighters-overlay");

const CSSProperties = require("./css-properties");

const Highlighter = require("highlighter/highlighter");

const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

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
  highlighter: any;
  searchBox?: HTMLElement | null;
  searchClearButton?: HTMLElement | null;
  searchResultsContainer?: HTMLElement | null;
  searchResultsLabel?: HTMLElement | null;
  searchboxShortcuts?: any;
  breadcrumbs?: any;

  private _toolbox: any;
  private _panels: Map<string, InspectorPanel>;
  private _highlighters?: any;
  private _search?: any;
  private _hasNewRoot?: boolean;
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

    // Map [panel id => panel instance]
    // Stores all the instances of sidebar panels like rule view, computed view, ...
    this._panels = new Map();

    this.highlighter = Highlighter;
  }

  /**
   * InspectorPanel.open() is effectively an asynchronous constructor.
   * Set any attributes or listeners that rely on the document being loaded or fronts
   * from the InspectorFront and Target here.
   */
  async init() {
    // We need to listen to changes in the target's pause state.
    await this._toolbox.getOrStartPanel("debugger");

    await this._deferredOpen();

    await this.onNewRoot();

    return this;
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

  get search() {
    if (!this._search) {
      this._search = new InspectorSearch(this, this.searchBox, this.searchClearButton);
    }

    return this._search;
  }

  get selection() {
    return this.toolbox.selection;
  }

  get cssProperties() {
    return CSSProperties;
  }

  _deferredOpen = async () => {
    // All the components are initialized. Take care of the remaining initialization
    // and setup.
    this.breadcrumbs = new HTMLBreadcrumbs(this);
    this.setupSearchBox();

    this.toolbox.on("select", this.handleToolSelected);
    ThreadFront.on("paused", this.handleThreadPaused);
    ThreadFront.on("resumed", this.handleThreadResumed);

    this.emit("ready");
  };

  /**
   * Hooks the searchbar to show result and auto completion suggestions.
   */
  setupSearchBox() {
    if (!this.panelDoc) return;

    this.searchBox = this.panelDoc.getElementById("inspector-searchbox");
    this.searchClearButton = this.panelDoc.getElementById("inspector-searchinput-clear");
    this.searchResultsContainer = this.panelDoc.getElementById("inspector-searchlabel-container");
    this.searchResultsLabel = this.panelDoc.getElementById("inspector-searchlabel");

    this.searchBox!.addEventListener(
      "focus",
      () => {
        this.search.on("search-cleared", this._clearSearchResultsLabel);
        this.search.on("search-result", this._updateSearchResultsLabel);
      },
      { once: true }
    );

    this.createSearchBoxShortcuts();
  }

  createSearchBoxShortcuts() {
    this.searchboxShortcuts = new KeyShortcuts({
      window: this.panelDoc!.defaultView,
      // The inspector search shortcuts need to be available from everywhere in the
      // inspector, and the inspector uses iframes (markupview, sidepanel webextensions).
      // Use the chromeEventHandler as the target to catch events from all frames.
      //target: this.toolbox.getChromeEventHandler(),
    });
    const key = INSPECTOR_L10N.getStr("inspector.searchHTML.key");
    this.searchboxShortcuts.on(key, (event: any) => {
      // Prevent overriding same shortcut from the computed/rule views
      if (
        event.originalTarget.closest("#sidebar-panel-ruleview") ||
        event.originalTarget.closest("#sidebar-panel-computedview")
      ) {
        return;
      }

      const win = event.originalTarget.ownerGlobal;
      // Check if the event is coming from an inspector window to avoid catching
      // events from other panels. Note, we are testing both win and win.parent
      // because the inspector uses iframes.
      if (win === this.panelWin || win.parent === this.panelWin) {
        event.preventDefault();
        this.searchBox!.focus();
      }
    });
  }

  get searchSuggestions() {
    return this.search.autocompleter;
  }

  _clearSearchResultsLabel = (result: any) => {
    return this._updateSearchResultsLabel(result, true);
  };

  _updateSearchResultsLabel = (result: any, clear = false) => {
    let str = "";
    if (!clear) {
      if (result) {
        str = INSPECTOR_L10N.getFormatStr(
          "inspector.searchResultsCount2",
          result.resultsIndex + 1,
          result.resultsLength
        );
      } else {
        str = INSPECTOR_L10N.getStr("inspector.searchResultsNone");
      }

      this.searchResultsContainer!.hidden = false;
    } else {
      this.searchResultsContainer!.hidden = true;
    }

    this.searchResultsLabel!.textContent = str;
  };

  /**
   * Check if the inspector should use the landscape mode.
   *
   * @return {Boolean} true if the inspector should be in landscape mode.
   */
  useLandscapeMode() {
    return true;
  }

  /**
   * Returns a boolean indicating whether a sidebar panel instance exists.
   */
  hasPanel(id: string) {
    return this._panels.has(id);
  }

  /**
   * Lazily get and create panel instances displayed in the sidebar
   */
  getPanel(id: string) {
    if (this._panels.has(id)) {
      return this._panels.get(id);
    }

    let panel;
    switch (id) {
      case "boxmodel":
        // box-model isn't a panel on its own, it used to, now it is being used by
        // the layout view which retrieves an instance via getPanel.
        const BoxModel = require("devtools/client/inspector/boxmodel/box-model");
        panel = new BoxModel(this, this.panelWin);
        break;
      case "computedview":
        panel = new ComputedPanel(this);
        break;
      case "layoutview":
        const LayoutView = require("devtools/client/inspector/layout/layout");
        panel = new LayoutView(this, this.panelWin);
        break;
      case "markupview":
        panel = new NewMarkupView(this, this.panelWin);
        break;
      case "ruleview":
        const RulesView = require("devtools/client/inspector/rules/rules");
        panel = new RulesView(this, this.panelWin);
        break;
      default:
        // This is a custom panel or a non lazy-loaded one.
        return null;
    }

    if (panel) {
      this._panels.set(id, panel);
    }

    return panel;
  }

  /**
   * Reset the inspector on new root mutation. This is called every time the
   * thread's position changes. This isn't super efficient, but we do things
   * this way because at each point the thread is paused we will be operating
   * on a different set of node fronts, which is essentially a new DOM tree
   * from the inspector's perspective. Clearing out the markup, selection,
   * and other state gives us a clean break from the previous pause point and
   * makes it easier to keep state consistent.
   */
  onNewRoot = async (force?: boolean) => {
    // Don't reload the inspector when not selected.
    if (this.toolbox && this.toolbox.currentTool != "inspector" && !force) {
      this._hasNewRoot = true;
      return;
    }
    this._hasNewRoot = false;

    // Restore the highlighter states prior to emitting "new-root".
    if (this._highlighters) {
      await Promise.all([
        this.highlighters.restoreFlexboxState(),
        this.highlighters.restoreGridState(),
      ]);
    }

    this.emit("new-root");
  };

  handleToolSelected = (id: string) => {
    if (id == "inspector" && this._hasNewRoot) {
      this.onNewRoot(/* force */ true);
    }
  };

  /**
   * When replaying, reset the inspector whenever the target pauses.
   */
  handleThreadPaused = () => {
    this.onNewRoot();
  };

  /**
   * When replaying, reset the inspector whenever the target resumes.
   */
  handleThreadResumed = () => {
    this.onNewRoot();
  };

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

    this.toolbox.off("select", this.handleToolSelected);
    ThreadFront.off("paused", this.handleThreadPaused);
    ThreadFront.off("resumed", this.handleThreadResumed);

    for (const [, panel] of this._panels) {
      panel.destroy();
    }
    this._panels.clear();

    if (this._highlighters) {
      this._highlighters.destroy();
      this._highlighters = null;
    }

    if (this._search) {
      this._search.destroy();
      this._search = null;
    }

    this.breadcrumbs.destroy();
    this.searchboxShortcuts.destroy();

    this._toolbox = null;
    this.breadcrumbs = null;
    this.panelDoc = null;
    (this.panelWin as any).inspector = null;
    this.panelWin = null;
    this.searchBox = null;
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
