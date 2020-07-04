/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const EventEmitter = require("devtools/shared/event-emitter");
const { executeSoon } = require("devtools/shared/DevToolsUtils");
const createStore = require("devtools/client/inspector/store");
const InspectorStyleChangeTracker = require("devtools/client/inspector/shared/style-change-tracker");
const { log } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const React = require("react");
const ReactDOM = require("react-dom");

require("devtools/client/themes/breadcrumbs.css");
require("devtools/client/themes/inspector.css");
require("devtools/client/themes/badge.css");
require("devtools/client/themes/rules.css");
require("devtools/client/themes/compatibility.css");
require("devtools/client/themes/computed.css");
require("devtools/client/themes/changes.css");
require("devtools/client/themes/fonts.css");
require("devtools/client/themes/boxmodel.css");
require("devtools/client/themes/layout.css");
require("devtools/client/themes/animation.css");
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
//require("devtools/client/shared/components/reps/reps.css");
//require("devtools/client/shared/components/tree/TreeView.css");
//require("devtools/content/shared/widgets/cubic-bezier.css");
//require("devtools/content/shared/widgets/filter-widget.css");
//require("devtools/content/shared/widgets/spectrum.css");

const { HTMLBreadcrumbs } = require("devtools/client/inspector/breadcrumbs");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
const { InspectorSearch } = require("devtools/client/inspector/inspector-search");

const { ToolSidebar } = require("devtools/client/inspector/toolsidebar");
const MarkupView = require("devtools/client/inspector/markup/markup");
const HighlightersOverlay = require("devtools/client/inspector/shared/highlighters-overlay");

//const CSSProperties = require("./css-properties");

const Highlighter = require("highlighter/highlighter");

/*
loader.lazyRequireGetter(
  this,
  "ExtensionSidebar",
  "devtools/client/inspector/extensions/extension-sidebar"
);
loader.lazyRequireGetter(
  this,
  "saveScreenshot",
  "devtools/shared/screenshot/save"
);
loader.lazyRequireGetter(
  this,
  "PICKER_TYPES",
  "devtools/shared/picker-constants"
);

// This import to chrome code is forbidden according to the inspector specific
// eslintrc. TODO: Fix in Bug 1591091.
// eslint-disable-next-line mozilla/reject-some-requires
loader.lazyImporter(
  this,
  "DeferredTask",
  "resource://gre/modules/DeferredTask.jsm"
);
*/

const { LocalizationHelper, localizeMarkup } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

// Sidebar dimensions
const INITIAL_SIDEBAR_SIZE = 350;

// How long we wait to debounce resize events
const LAZY_RESIZE_INTERVAL_MS = 200;

// If the toolbox's width is smaller than the given amount of pixels, the sidebar
// automatically switches from 'landscape/horizontal' to 'portrait/vertical' mode.
const PORTRAIT_MODE_WIDTH_THRESHOLD = 700;
// If the toolbox's width docked to the side is smaller than the given amount of pixels,
// the sidebar automatically switches from 'landscape/horizontal' to 'portrait/vertical'
// mode.
const SIDE_PORTAIT_MODE_WIDTH_THRESHOLD = 1000;

const THREE_PANE_ENABLED_PREF = "devtools.inspector.three-pane-enabled";
const THREE_PANE_ENABLED_SCALAR = "devtools.inspector.three_pane_enabled";
const THREE_PANE_CHROME_ENABLED_PREF = "devtools.inspector.chrome.three-pane-enabled";
const TELEMETRY_EYEDROPPER_OPENED = "devtools.toolbar.eyedropper.opened";
const TELEMETRY_SCALAR_NODE_SELECTION_COUNT = "devtools.inspector.node_selection_count";

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
function Inspector(toolbox) {
  EventEmitter.decorate(this);

  this._toolbox = toolbox;
  this._target = toolbox.target;
  this.panelDoc = window.document;
  this.panelWin = window;
  this.panelWin.inspector = this;
  this.telemetry = toolbox.telemetry;
  this.store = createStore();

  // Map [panel id => panel instance]
  // Stores all the instances of sidebar panels like rule view, computed view, ...
  this._panels = new Map();

  this._clearSearchResultsLabel = this._clearSearchResultsLabel.bind(this);
  this._handleRejectionIfNotDestroyed = this._handleRejectionIfNotDestroyed.bind(this);
  this._onTargetAvailable = this._onTargetAvailable.bind(this);
  this._onTargetDestroyed = this._onTargetDestroyed.bind(this);
  this._onBeforeNavigate = this._onBeforeNavigate.bind(this);
  this._updateSearchResultsLabel = this._updateSearchResultsLabel.bind(this);

  this.onDetached = this.onDetached.bind(this);
  this.onHostChanged = this.onHostChanged.bind(this);
  this.onNewSelection = this.onNewSelection.bind(this);
  this.onNewRoot = this.onNewRoot.bind(this);
  this.onPanelWindowResize = this.onPanelWindowResize.bind(this);
  this.onShowBoxModelHighlighterForNode = this.onShowBoxModelHighlighterForNode.bind(this);
  this.onSidebarHidden = this.onSidebarHidden.bind(this);
  this.onSidebarResized = this.onSidebarResized.bind(this);
  this.onSidebarSelect = this.onSidebarSelect.bind(this);
  this.onSidebarShown = this.onSidebarShown.bind(this);
  this.onSidebarToggle = this.onSidebarToggle.bind(this);
  this.handleThreadPaused = this.handleThreadPaused.bind(this);
  this.handleThreadResumed = this.handleThreadResumed.bind(this);
  this.handleToolSelected = this.handleToolSelected.bind(this);

  this.highlighter = Highlighter;
}

Inspector.prototype = {
  /**
   * InspectorPanel.open() is effectively an asynchronous constructor.
   * Set any attributes or listeners that rely on the document being loaded or fronts
   * from the InspectorFront and Target here.
   */
  async init() {
    // Localize all the nodes containing a data-localization attribute.
    //localizeMarkup(this.panelDoc);

    await this._onTargetAvailable();

    // We need to listen to changes in the target's pause state.
    const dbg = this._getDebugger();
    this._replayResumed = !dbg.isPaused();

    this.styleChangeTracker = new InspectorStyleChangeTracker(this);

    this._markupBox = this.panelDoc.getElementById("markup-box");

    return this._deferredOpen();
  },

  _getDebugger() {
    return this._toolbox.getPanel("debugger");
  },

  async _onTargetAvailable() {
    await Promise.all([this._getDefaultSelection()]);

    // When we navigate to another process and switch to a new
    // target and the inspector is already ready, we want to
    // update the markup view accordingly. So force a new-root event.
    // For the initial panel startup, the initial top level target
    // update the markup view from _deferredOpen.
    // We might want to followup here in order to share the same
    // codepath between the initial top level target and the next
    // one we switch to. i.e. extract from deferredOpen code
    // which has to be called only once on inspector startup.
    // Then move the rest to onNewRoot and always call onNewRoot from here.
    if (this.isReady) {
      this.onNewRoot();
    } else {
      this.once("ready", this.onNewRoot);
    }
  },

  _onTargetDestroyed({ type, targetFront, isTopLevel }) {
    // Ignore all targets but the top level one
    if (!isTopLevel) {
      return;
    }
    targetFront.off("will-navigate", this._onBeforeNavigate);

    this._defaultNode = null;
    this.selection.setNodeFront(null);
  },

  get toolbox() {
    return this._toolbox;
  },

  get highlighters() {
    if (!this._highlighters) {
      this._highlighters = new HighlightersOverlay(this);
    }

    return this._highlighters;
  },

  get isHighlighterReady() {
    return !!this._highlighters;
  },

  get is3PaneModeEnabled() {
    if (!this._is3PaneModeEnabled) {
      this._is3PaneModeEnabled = Services.prefs.getBoolPref(THREE_PANE_ENABLED_PREF);
    }

    return this._is3PaneModeEnabled;
  },

  set is3PaneModeEnabled(value) {
    if (this.currentTarget.chrome) {
      this._is3PaneModeChromeEnabled = value;
      Services.prefs.setBoolPref(THREE_PANE_CHROME_ENABLED_PREF, this._is3PaneModeChromeEnabled);
    } else {
      this._is3PaneModeEnabled = value;
      Services.prefs.setBoolPref(THREE_PANE_ENABLED_PREF, this._is3PaneModeEnabled);
    }
  },

  get search() {
    if (!this._search) {
      this._search = new InspectorSearch(this, this.searchBox, this.searchClearButton);
    }

    return this._search;
  },

  get selection() {
    return this.toolbox.selection;
  },

  get cssProperties() {
    return {
      supportsType: () => true,
      supportsCssColor4ColorFunction: () => true,
      getSubproperties(name) {
        return [name];
        //return CSSProperties[name];
      },
      isKnown: () => true,
    };
  },

  /**
   * Handle promise rejections for various asynchronous actions, and only log errors if
   * the inspector panel still exists.
   * This is useful to silence useless errors that happen when the inspector is closed
   * while still initializing (and making protocol requests).
   */
  _handleRejectionIfNotDestroyed: function (e) {
    if (!this._destroyed) {
      console.error(e);
    }
  },

  _deferredOpen: async function () {
    this.isReady = false;

    // Set the node front so that the markup and sidebar panels will have the selected
    // nodeFront ready when they're initialized.
    if (this._defaultNode) {
      await this._defaultNode.ensureParentsLoaded();
      this.selection.setNodeFront(this._defaultNode, {
        reason: "inspector-open",
      });
    }

    // Setup the splitter before the sidebar is displayed so, we don't miss any events.
    this.setupSplitter();

    // We can display right panel with: tab bar, markup view and breadbrumb. Right after
    // the splitter set the right and left panel sizes, in order to avoid resizing it
    // during load of the inspector.
    this.panelDoc.getElementById("inspector-main-content").style.visibility = "visible";

    // Setup the sidebar panels.
    this.setupSidebar();

    this.onMarkupLoaded();

    this.isReady = true;

    // All the components are initialized. Take care of the remaining initialization
    // and setup.
    this.breadcrumbs = new HTMLBreadcrumbs(this);
    this.setupExtensionSidebars();
    this.setupSearchBox();
    await this.setupToolbar();

    this.onNewSelection();

    this.toolbox.on("host-changed", this.onHostChanged);
    this.toolbox.on("select", this.handleToolSelected);
    this.selection.on("new-node-front", this.onNewSelection);
    this.selection.on("detached-front", this.onDetached);
    console.log("ListenForPaused");
    ThreadFront.on("paused", this.handleThreadPaused);
    ThreadFront.on("instantWarp", this.handleThreadPaused);
    ThreadFront.on("resumed", this.handleThreadResumed);

    this.emit("ready");
    return this;
  },

  _onBeforeNavigate: function () {
    this._defaultNode = null;
    this.selection.setNodeFront(null);
    // this._destroyMarkup();
    this._pendingSelection = null;
  },

  _getDefaultSelection: function () {
    // This may throw if the document is still loading and we are
    // refering to a dead about:blank document
    return this._getDefaultNodeForSelection().catch(this._handleRejectionIfNotDestroyed);
  },

  /**
   * Return a promise that will resolve to the default node for selection.
   */
  _getDefaultNodeForSelection: async function () {
    if (this._defaultNode) {
      return this._defaultNode;
    }

    console.log("Inspector getDefaultNodeForSelection Start");

    let rootNode = null;
    const pendingSelection = this._pendingSelection;

    // A helper to tell if the target has or is about to navigate.
    // this._pendingSelection changes on "will-navigate" and "new-root" events.
    // When replaying, if the target is unpaused then we consider it to be
    // navigating so that its tree will not be constructed.
    const hasNavigated = () => {
      return pendingSelection !== this._pendingSelection || this._replayResumed;
    };

    if (hasNavigated()) {
      return null;
    }

    this._showMarkupLoading();

    // If available, set either the previously selected node or the body
    // as default selected, else set documentElement
    rootNode = await ThreadFront.getRootDOMNode();

    console.log("Inspector getDefaultNodeForSelection HasRoot");

    if (hasNavigated()) {
      return null;
    }

    if (!rootNode) {
      return null;
    }

    let selectedNode;
    if (this.selectionCssSelectors.length) {
      selectedNode = await walker.findNodeFront(this.selectionCssSelectors);

      console.log("Inspector getDefaultNodeForSelection FoundSelection");
    }

    if (hasNavigated()) {
      return null;
    }

    if (!selectedNode) {
      selectedNode = await rootNode.querySelector("body");

      console.log("Inspector getDefaultNodeForSelection GotBody");

      if (hasNavigated()) {
        return null;
      }

      if (!selectedNode) {
        selectedNode = await this.walker.documentElement();

        console.log("Inspector getDefaultNodeForSelection GotDocument");

        if (hasNavigated()) {
          return null;
        }
      }
    }

    console.log("Inspector getDefaultNodeForSelection Finished", selectedNode);

    this._defaultNode = selectedNode;
    return selectedNode;
  },

  /**
   * Hooks the searchbar to show result and auto completion suggestions.
   */
  setupSearchBox: function () {
    this.searchBox = this.panelDoc.getElementById("inspector-searchbox");
    this.searchClearButton = this.panelDoc.getElementById("inspector-searchinput-clear");
    this.searchResultsContainer = this.panelDoc.getElementById("inspector-searchlabel-container");
    this.searchResultsLabel = this.panelDoc.getElementById("inspector-searchlabel");

    this.searchBox.addEventListener(
      "focus",
      () => {
        this.search.on("search-cleared", this._clearSearchResultsLabel);
        this.search.on("search-result", this._updateSearchResultsLabel);
      },
      { once: true }
    );

    this.createSearchBoxShortcuts();
  },

  createSearchBoxShortcuts() {
    this.searchboxShortcuts = new KeyShortcuts({
      window: this.panelDoc.defaultView,
      // The inspector search shortcuts need to be available from everywhere in the
      // inspector, and the inspector uses iframes (markupview, sidepanel webextensions).
      // Use the chromeEventHandler as the target to catch events from all frames.
      //target: this.toolbox.getChromeEventHandler(),
    });
    const key = INSPECTOR_L10N.getStr("inspector.searchHTML.key");
    this.searchboxShortcuts.on(key, event => {
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
        this.searchBox.focus();
      }
    });
  },

  get searchSuggestions() {
    return this.search.autocompleter;
  },

  _clearSearchResultsLabel: function (result) {
    return this._updateSearchResultsLabel(result, true);
  },

  _updateSearchResultsLabel: function (result, clear = false) {
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

      this.searchResultsContainer.hidden = false;
    } else {
      this.searchResultsContainer.hidden = true;
    }

    this.searchResultsLabel.textContent = str;
  },

  get React() {
    return this._toolbox.React;
  },

  get ReactDOM() {
    return this._toolbox.ReactDOM;
  },

  get ReactRedux() {
    return this._toolbox.ReactRedux;
  },

  get InspectorTabPanel() {
    if (!this._InspectorTabPanel) {
      this._InspectorTabPanel = React.createFactory(
        require("devtools/client/inspector/components/InspectorTabPanel")
      );
    }
    return this._InspectorTabPanel;
  },

  get InspectorSplitBox() {
    if (!this._InspectorSplitBox) {
      this._InspectorSplitBox = React.createFactory(
        require("devtools/client/shared/components/splitter/SplitBox")
      );
    }
    return this._InspectorSplitBox;
  },

  get TabBar() {
    if (!this._TabBar) {
      this._TabBar = React.createFactory(require("devtools/client/shared/components/tabs/TabBar"));
    }
    return this._TabBar;
  },

  /**
   * Check if the inspector should use the landscape mode.
   *
   * @return {Boolean} true if the inspector should be in landscape mode.
   */
  useLandscapeMode: function () {
    return true;
    /*
    if (!this.panelDoc) {
      return true;
    }

    const splitterBox = this.panelDoc.getElementById("inspector-splitter-box");
    const { width } = window.windowUtils.getBoundsWithoutFlushing(splitterBox);

    return this.is3PaneModeEnabled &&
      (this.toolbox.hostType == Toolbox.HostType.LEFT ||
        this.toolbox.hostType == Toolbox.HostType.RIGHT)
      ? width > SIDE_PORTAIT_MODE_WIDTH_THRESHOLD
      : width > PORTRAIT_MODE_WIDTH_THRESHOLD;
    */
  },

  /**
   * Build Splitter located between the main and side area of
   * the Inspector panel.
   */
  setupSplitter: function () {
    const { width, height, splitSidebarWidth } = this.getSidebarSize();

    this.sidebarSplitBoxRef = React.createRef();

    const splitter = this.InspectorSplitBox({
      className: "inspector-sidebar-splitter",
      initialWidth: width,
      initialHeight: height,
      minSize: "10%",
      maxSize: "80%",
      splitterSize: 1,
      endPanelControl: true,
      startPanel: this.InspectorTabPanel({
        id: "inspector-main-content",
      }),
      endPanel: this.InspectorSplitBox({
        initialWidth: splitSidebarWidth,
        minSize: 10,
        maxSize: "80%",
        splitterSize: this.is3PaneModeEnabled ? 1 : 0,
        endPanelControl: this.is3PaneModeEnabled,
        startPanel: this.InspectorTabPanel({
          id: "inspector-rules-container",
        }),
        endPanel: this.InspectorTabPanel({
          id: "inspector-sidebar-container",
        }),
        ref: this.sidebarSplitBoxRef,
      }),
      vert: this.useLandscapeMode(),
      onControlledPanelResized: this.onSidebarResized,
    });

    this.splitBox = ReactDOM.render(
      splitter,
      this.panelDoc.getElementById("inspector-splitter-box")
    );

    this.panelWin.addEventListener("resize", this.onPanelWindowResize, true);
  },

  _onLazyPanelResize: async function () {
    // We can be called on a closed window because of the deferred task.
    if (window.closed) {
      return;
    }

    this.splitBox.setState({ vert: this.useLandscapeMode() });
    this.emit("inspector-resize");
  },

  /**
   * If Toolbox width is less than 600 px, the splitter changes its mode
   * to `horizontal` to support portrait view.
   */
  onPanelWindowResize: function () {
    if (this.toolbox.currentTool !== "inspector") {
      return;
    }

    /*
    if (!this._lazyResizeHandler) {
      this._lazyResizeHandler = new DeferredTask(
        this._onLazyPanelResize.bind(this),
        LAZY_RESIZE_INTERVAL_MS,
        0
      );
    }
    this._lazyResizeHandler.arm();
    */
  },

  getSidebarSize: function () {
    let width;
    let height;
    let splitSidebarWidth;

    // Initialize splitter size from preferences.
    try {
      width = Services.prefs.getIntPref("devtools.toolsidebar-width.inspector");
      height = Services.prefs.getIntPref("devtools.toolsidebar-height.inspector");
      splitSidebarWidth = Services.prefs.getIntPref(
        "devtools.toolsidebar-width.inspector.splitsidebar"
      );
    } catch (e) {
      // Set width and height of the splitter. Only one
      // value is really useful at a time depending on the current
      // orientation (vertical/horizontal).
      // Having both is supported by the splitter component.
      width = this.is3PaneModeEnabled ? INITIAL_SIDEBAR_SIZE * 2 : INITIAL_SIDEBAR_SIZE;
      height = INITIAL_SIDEBAR_SIZE;
      splitSidebarWidth = INITIAL_SIDEBAR_SIZE;
    }

    return { width, height, splitSidebarWidth };
  },

  onSidebarHidden: function () {
    // Store the current splitter size to preferences.
    const state = this.splitBox.state;
    Services.prefs.setIntPref("devtools.toolsidebar-width.inspector", state.width);
    Services.prefs.setIntPref("devtools.toolsidebar-height.inspector", state.height);
    Services.prefs.setIntPref(
      "devtools.toolsidebar-width.inspector.splitsidebar",
      this.sidebarSplitBoxRef.current.state.width
    );
  },

  onSidebarResized: function (width, height) {
    this.toolbox.emit("inspector-sidebar-resized", { width, height });
  },

  onSidebarSelect: function (toolId) {
    // Save the currently selected sidebar panel
    Services.prefs.setCharPref("devtools.inspector.activeSidebar", toolId);

    // Then forces the panel creation by calling getPanel
    // (This allows lazy loading the panels only once we select them)
    this.getPanel(toolId);

    this.toolbox.emit("inspector-sidebar-select", toolId);
  },

  onSidebarShown: function () {
    const { width, height, splitSidebarWidth } = this.getSidebarSize();
    this.splitBox.setState({ width, height });
    this.sidebarSplitBoxRef.current.setState({ width: splitSidebarWidth });
  },

  async onSidebarToggle() {
    this.is3PaneModeEnabled = !this.is3PaneModeEnabled;
    await this.setupToolbar();
    this.addRuleView({ skipQueue: true });
  },

  /**
   * Sets the inspector sidebar split box state. Shows the splitter inside the sidebar
   * split box, specifies the end panel control and resizes the split box width depending
   * on the width of the toolbox.
   */
  setSidebarSplitBoxState() {
    const toolboxWidth = this.panelDoc.getElementById("inspector-splitter-box").clientWidth;

    // Get the inspector sidebar's (right panel in horizontal mode or bottom panel in
    // vertical mode) width.
    const sidebarWidth = this.splitBox.state.width;
    // This variable represents the width of the right panel in horizontal mode or
    // bottom-right panel in vertical mode width in 3 pane mode.
    let sidebarSplitboxWidth;

    if (this.useLandscapeMode()) {
      // Whether or not doubling the inspector sidebar's (right panel in horizontal mode
      // or bottom panel in vertical mode) width will be bigger than half of the
      // toolbox's width.
      const canDoubleSidebarWidth = sidebarWidth * 2 < toolboxWidth / 2;

      // Resize the main split box's end panel that contains the middle and right panel.
      // Attempts to resize the main split box's end panel to be double the size of the
      // existing sidebar's width when switching to 3 pane mode. However, if the middle
      // and right panel's width together is greater than half of the toolbox's width,
      // split all 3 panels to be equally sized by resizing the end panel to be 2/3 of
      // the current toolbox's width.
      this.splitBox.setState({
        width: canDoubleSidebarWidth ? sidebarWidth * 2 : (toolboxWidth * 2) / 3,
      });

      // In landscape/horizontal mode, set the right panel back to its original
      // inspector sidebar width if we can double the sidebar width. Otherwise, set
      // the width of the right panel to be 1/3 of the toolbox's width since all 3
      // panels will be equally sized.
      sidebarSplitboxWidth = canDoubleSidebarWidth ? sidebarWidth : toolboxWidth / 3;
    } else {
      // In portrait/vertical mode, set the bottom-right panel to be 1/2 of the
      // toolbox's width.
      sidebarSplitboxWidth = toolboxWidth / 2;
    }

    // Show the splitter inside the sidebar split box. Sets the width of the inspector
    // sidebar and specify that the end (right in horizontal or bottom-right in
    // vertical) panel of the sidebar split box should be controlled when resizing.
    this.sidebarSplitBoxRef.current.setState({
      endPanelControl: true,
      splitterSize: 1,
      width: sidebarSplitboxWidth,
    });
  },

  /**
   * Adds the rule view to the middle (in landscape/horizontal mode) or bottom-left panel
   * (in portrait/vertical mode) or inspector sidebar depending on whether or not it is 3
   * pane mode. The default tab specifies whether or not the rule view should be selected.
   * The defaultTab defaults to the rule view when reverting to the 2 pane mode and the
   * rule view is being merged back into the inspector sidebar from middle/bottom-left
   * panel. Otherwise, we specify the default tab when handling the sidebar setup.
   *
   * @params {String} defaultTab
   *         Thie id of the default tab for the sidebar.
   */
  addRuleView({ defaultTab = "ruleview", skipQueue = false } = {}) {
    const ruleViewSidebar = this.sidebarSplitBoxRef.current.startPanelContainer;

    if (this.is3PaneModeEnabled) {
      // Convert to 3 pane mode by removing the rule view from the inspector sidebar
      // and adding the rule view to the middle (in landscape/horizontal mode) or
      // bottom-left (in portrait/vertical mode) panel.
      ruleViewSidebar.style.display = "block";

      this.setSidebarSplitBoxState();

      // Force the rule view panel creation by calling getPanel
      this.getPanel("ruleview");

      this.sidebar.removeTab("ruleview");

      this.ruleViewSideBar.addExistingTab(
        "ruleview",
        INSPECTOR_L10N.getStr("inspector.sidebar.ruleViewTitle"),
        true
      );

      this.ruleViewSideBar.show();
    } else {
      // Removes the rule view from the 3 pane mode and adds the rule view to the main
      // inspector sidebar.
      ruleViewSidebar.style.display = "none";

      // Set the width of the split box (right panel in horziontal mode and bottom panel
      // in vertical mode) to be the width of the inspector sidebar.
      const splitterBox = this.panelDoc.getElementById("inspector-splitter-box");
      this.splitBox.setState({
        width: this.useLandscapeMode()
          ? this.sidebarSplitBoxRef.current.state.width
          : splitterBox.clientWidth,
      });

      // Hide the splitter to prevent any drag events in the sidebar split box and
      // specify that the end (right panel in horziontal mode or bottom panel in vertical
      // mode) panel should be uncontrolled when resizing.
      this.sidebarSplitBoxRef.current.setState({
        endPanelControl: false,
        splitterSize: 0,
      });

      this.ruleViewSideBar.hide();
      this.ruleViewSideBar.removeTab("ruleview");

      if (skipQueue) {
        this.sidebar.addExistingTab(
          "ruleview",
          INSPECTOR_L10N.getStr("inspector.sidebar.ruleViewTitle"),
          defaultTab == "ruleview",
          0
        );
      } else {
        this.sidebar.queueExistingTab(
          "ruleview",
          INSPECTOR_L10N.getStr("inspector.sidebar.ruleViewTitle"),
          defaultTab == "ruleview",
          0
        );
      }
    }

    this.emit("ruleview-added");
  },

  /**
   * Returns a boolean indicating whether a sidebar panel instance exists.
   */
  hasPanel: function (id) {
    return this._panels.has(id);
  },

  /**
   * Lazily get and create panel instances displayed in the sidebar
   */
  getPanel: function (id) {
    if (this._panels.has(id)) {
      return this._panels.get(id);
    }

    let panel;
    switch (id) {
      case "animationinspector":
        const AnimationInspector = require("devtools/client/inspector/animation/animation");
        panel = new AnimationInspector(this, this.panelWin);
        break;
      case "boxmodel":
        // box-model isn't a panel on its own, it used to, now it is being used by
        // the layout view which retrieves an instance via getPanel.
        const BoxModel = require("devtools/client/inspector/boxmodel/box-model");
        panel = new BoxModel(this, this.panelWin);
        break;
      case "changesview":
        const ChangesView = require("devtools/client/inspector/changes/ChangesView");
        panel = new ChangesView(this, this.panelWin);
        break;
      case "compatibilityview":
        const CompatibilityView = require("devtools/client/inspector/compatibility/CompatibilityView");
        panel = new CompatibilityView(this, this.panelWin);
        break;
      case "computedview":
        const { ComputedViewTool } = require("devtools/client/inspector/computed/computed");
        panel = new ComputedViewTool(this, this.panelWin);
        break;
      case "fontinspector":
        const FontInspector = require("devtools/client/inspector/fonts/fonts");
        panel = new FontInspector(this, this.panelWin);
        break;
      case "layoutview":
        const LayoutView = require("devtools/client/inspector/layout/layout");
        panel = new LayoutView(this, this.panelWin);
        break;
      case "newruleview":
        const RulesView = require("devtools/client/inspector/rules/new-rules");
        panel = new RulesView(this, this.panelWin);
        break;
      case "ruleview":
        const { RuleViewTool } = require("devtools/client/inspector/rules/rules");
        panel = new RuleViewTool(this, this.panelWin);
        break;
      default:
        // This is a custom panel or a non lazy-loaded one.
        return null;
    }

    if (panel) {
      this._panels.set(id, panel);
    }

    return panel;
  },

  /**
   * Build the sidebar.
   */
  setupSidebar() {
    const sidebar = this.panelDoc.getElementById("inspector-sidebar");
    const options = {
      showAllTabsMenu: true,
      sidebarToggleButton: {
        collapsed: !this.is3PaneModeEnabled,
        collapsePaneTitle: INSPECTOR_L10N.getStr("inspector.hideThreePaneMode"),
        expandPaneTitle: INSPECTOR_L10N.getStr("inspector.showThreePaneMode"),
        onClick: this.onSidebarToggle,
      },
    };

    this.sidebar = new ToolSidebar(sidebar, this, "inspector", options);
    this.sidebar.on("select", this.onSidebarSelect);

    const ruleSideBar = this.panelDoc.getElementById("inspector-rules-sidebar");
    this.ruleViewSideBar = new ToolSidebar(ruleSideBar, this, "inspector", {
      hideTabstripe: true,
    });

    // defaultTab may also be an empty string or a tab id that doesn't exist anymore
    // (e.g. it was a tab registered by an addon that has been uninstalled).
    let defaultTab = Services.prefs.getCharPref("devtools.inspector.activeSidebar");

    if (this.is3PaneModeEnabled && defaultTab === "ruleview") {
      defaultTab = "layoutview";
    }

    // Append all side panels

    this.addRuleView({ defaultTab });

    // Inspector sidebar panels in order of appearance.
    const sidebarPanels = [
      {
        id: "layoutview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.layoutViewTitle2"),
      },
      {
        id: "computedview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.computedViewTitle"),
      },
      /*
      {
        id: "changesview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.changesViewTitle"),
      },
      {
        id: "fontinspector",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.fontInspectorTitle"),
      },
      {
        id: "animationinspector",
        title: INSPECTOR_L10N.getStr(
          "inspector.sidebar.animationInspectorTitle"
        ),
      },
      */
    ];

    if (Services.prefs.getBoolPref("devtools.inspector.new-rulesview.enabled")) {
      sidebarPanels.push({
        id: "newruleview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.ruleViewTitle"),
      });
    }

    if (Services.prefs.getBoolPref("devtools.inspector.compatibility.enabled")) {
      sidebarPanels.push({
        id: "compatibilityview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.compatibilityViewTitle"),
      });
    }

    for (const { id, title } of sidebarPanels) {
      // The Computed panel is not a React-based panel. We pick its element container from
      // the DOM and wrap it in a React component (InspectorTabPanel) so it behaves like
      // other panels when using the Inspector's tool sidebar.
      if (id === "computedview") {
        this.sidebar.queueExistingTab(id, title, defaultTab === id);
      } else {
        // When `panel` is a function, it is called when the tab should render. It is
        // expected to return a React component to populate the tab's content area.
        // Calling this method on-demand allows us to lazy-load the requested panel.
        this.sidebar.queueTab(
          id,
          title,
          {
            props: {
              id,
              title,
            },
            panel: () => {
              return this.getPanel(id).provider;
            },
          },
          defaultTab === id
        );
      }
    }

    this.sidebar.addAllQueuedTabs();

    // Persist splitter state in preferences.
    this.sidebar.on("show", this.onSidebarShown);
    this.sidebar.on("hide", this.onSidebarHidden);
    this.sidebar.on("destroy", this.onSidebarHidden);

    this.sidebar.show();
  },

  /**
   * Setup any extension sidebar already registered to the toolbox when the inspector.
   * has been created for the first time.
   */
  setupExtensionSidebars() {
    /*
    for (const [sidebarId, { title }] of this.toolbox
      .inspectorExtensionSidebars) {
      this.addExtensionSidebar(sidebarId, { title });
    }
    */
  },

  /**
   * Create a side-panel tab controlled by an extension
   * using the devtools.panels.elements.createSidebarPane and sidebar object API
   *
   * @param {String} id
   *        An unique id for the sidebar tab.
   * @param {Object} options
   * @param {String} options.title
   *        The tab title
   */
  addExtensionSidebar: function (id, { title }) {
    if (this._panels.has(id)) {
      throw new Error(`Cannot create an extension sidebar for the existent id: ${id}`);
    }

    const extensionSidebar = new ExtensionSidebar(this, { id, title });

    // TODO(rpl): pass some extension metadata (e.g. extension name and icon) to customize
    // the render of the extension title (e.g. use the icon in the sidebar and show the
    // extension name in a tooltip).
    this.addSidebarTab(id, title, extensionSidebar.provider, false);

    this._panels.set(id, extensionSidebar);

    // Emit the created ExtensionSidebar instance to the listeners registered
    // on the toolbox by the "devtools.panels.elements" WebExtensions API.
    this.toolbox.emit(`extension-sidebar-created-${id}`, extensionSidebar);
  },

  /**
   * Remove and destroy a side-panel tab controlled by an extension (e.g. when the
   * extension has been disable/uninstalled while the toolbox and inspector were
   * still open).
   *
   * @param {String} id
   *        The id of the sidebar tab to destroy.
   */
  removeExtensionSidebar: function (id) {
    if (!this._panels.has(id)) {
      throw new Error(`Unable to find a sidebar panel with id "${id}"`);
    }

    const panel = this._panels.get(id);

    if (!(panel instanceof ExtensionSidebar)) {
      throw new Error(`The sidebar panel with id "${id}" is not an ExtensionSidebar`);
    }

    this._panels.delete(id);
    this.sidebar.removeTab(id);
    panel.destroy();
  },

  /**
   * Register a side-panel tab. This API can be used outside of
   * DevTools (e.g. from an extension) as well as by DevTools
   * code base.
   *
   * @param {string} tab uniq id
   * @param {string} title tab title
   * @param {React.Component} panel component. See `InspectorPanelTab` as an example.
   * @param {boolean} selected true if the panel should be selected
   */
  addSidebarTab: function (id, title, panel, selected) {
    this.sidebar.addTab(id, title, panel, selected);
  },

  /**
   * Method to check whether the document is a HTML document and
   * pickColorFromPage method is available or not.
   *
   * @return {Boolean} true if the eyedropper highlighter is supported by the current
   *         document.
   */
  async supportsEyeDropper() {
    return true;
  },

  async setupToolbar() {
    this.teardownToolbar();

    // Setup the add-node button.
    this.addNode = this.addNode.bind(this);
    this.addNodeButton = this.panelDoc.getElementById("inspector-element-add-button");
    this.addNodeButton.addEventListener("click", this.addNode);

    // Setup the eye-dropper icon if we're in an HTML document and we have actor support.
    const canShowEyeDropper = await this.supportsEyeDropper();

    // Bail out if the inspector was destroyed in the meantime and panelDoc is no longer
    // available.
    if (!this.panelDoc) {
      return;
    }

    if (canShowEyeDropper) {
      this.onEyeDropperDone = this.onEyeDropperDone.bind(this);
      this.onEyeDropperButtonClicked = this.onEyeDropperButtonClicked.bind(this);
      this.eyeDropperButton = this.panelDoc.getElementById("inspector-eyedropper-toggle");
      this.eyeDropperButton.disabled = false;
      this.eyeDropperButton.title = INSPECTOR_L10N.getStr("inspector.eyedropper.label");
      this.eyeDropperButton.addEventListener("click", this.onEyeDropperButtonClicked);
    } else {
      const eyeDropperButton = this.panelDoc.getElementById("inspector-eyedropper-toggle");
      eyeDropperButton.disabled = true;
      eyeDropperButton.title = INSPECTOR_L10N.getStr("eyedropper.disabled.title");
    }

    this.emit("inspector-toolbar-updated");
  },

  teardownToolbar: function () {
    if (this.addNodeButton) {
      this.addNodeButton.removeEventListener("click", this.addNode);
      this.addNodeButton = null;
    }

    if (this.eyeDropperButton) {
      this.eyeDropperButton.removeEventListener("click", this.onEyeDropperButtonClicked);
      this.eyeDropperButton = null;
    }
  },

  /**
   * Reset the inspector on new root mutation.
   */
  async onNewRoot(force) {
    // Don't reload the inspector when not selected.
    if (this.toolbox && this.toolbox.currentTool != "inspector" && !force) {
      this._hasNewRoot = true;
      return;
    }
    this._hasNewRoot = false;

    this._defaultNode = null;
    this.selection.setNodeFront(null);
    // this._destroyMarkup();

    const selectionId = Math.random();
    this._pendingSelection = selectionId;

    const defaultNode = await this._getDefaultNodeForSelection();

    // Cancel this promise resolution as a new one had
    // been queued up.
    if (this._pendingSelection != selectionId) {
      return;
    }

    if (defaultNode) {
      await defaultNode.ensureParentsLoaded();
      if (this._pendingSelection != selectionId) {
        return;
      }
      this.selection.setNodeFront(defaultNode, { reason: "navigateaway" });
    }

    this._pendingSelection = null;
    this.onMarkupLoaded();
  },

  handleToolSelected(id) {
    if (id == "inspector" && this._hasNewRoot) {
      this.onNewRoot(/* force */ true);
    }
  },

  /**
   * When replaying, reset the inspector whenever the target pauses.
   */
  handleThreadPaused() {
    console.log("Inspector HandleThreadPaused");
    this._replayResumed = false;
    this.onNewRoot();
  },

  /**
   * When replaying, reset the inspector whenever the target resumes.
   */
  handleThreadResumed() {
    this._replayResumed = true;
    this.onNewRoot();
  },

  /**
   * Handler for "markuploaded" event fired on a new root mutation and after the markup
   * view is initialized. Expands the current selected node and restores the saved
   * highlighter state.
   */
  async onMarkupLoaded() {
    this.markup = new MarkupView(this);

    const loading = document.getElementById("markup-loading");
    loading.hidden = true;
    log(`Inspector HideMarkupLoading`);

    if (!this.markup) {
      return;
    }

    if (this.selection.nodeFront) {
      this.markup.expandNode(this.selection.nodeFront);
    }

    // Restore the highlighter states prior to emitting "new-root".
    if (this._highlighters) {
      await Promise.all([
        this.highlighters.restoreFlexboxState(),
        this.highlighters.restoreGridState(),
      ]);
    }

    this.emit("new-root");
  },

  _showMarkupLoading() {
    const loading = document.getElementById("markup-loading");
    loading.hidden = false;
    log(`Inspector ShowMarkupLoading`);
  },

  _selectionCssSelectors: null,

  /**
   * Set the array of CSS selectors for the currently selected node.
   * We use an array of selectors in case the element is in iframes.
   * Will store the current target url along with it to allow pre-selection at
   * reload
   */
  set selectionCssSelectors(cssSelectors = []) {
    if (this._destroyed) {
      return;
    }

    this._selectionCssSelectors = {
      selectors: cssSelectors,
      url: this.currentTarget.url,
    };
  },

  /**
   * Get the CSS selectors for the current selection if any, that is, if a node
   * is actually selected and that node has been selected while on the same url
   */
  get selectionCssSelectors() {
    if (this._selectionCssSelectors && this._selectionCssSelectors.url === this.currentTarget.url) {
      return this._selectionCssSelectors.selectors;
    }
    return [];
  },

  /**
   * Some inspector ruleview helpers rely on the selectionCssSelector to get the
   * unique CSS selector of the selected element only within its host document,
   * disregarding ancestor iframes.
   * They should not care about the complete array of CSS selectors, only
   * relevant in order to reselect the proper node when reloading pages with
   * frames.
   */
  get selectionCssSelector() {
    if (this.selectionCssSelectors.length) {
      return this.selectionCssSelectors[this.selectionCssSelectors.length - 1];
    }

    return null;
  },

  /**
   * On any new selection made by the user, store the array of css selectors
   * of the selected node so it can be restored after reload of the same page
   */
  updateSelectionCssSelectors() {
    /*
    if (this.selection.isElementNode()) {
      this.selection.nodeFront.getAllSelectors().then(selectors => {
        this.selectionCssSelectors = selectors;
      }, this._handleRejectionIfNotDestroyed);
    }
    */
  },

  /**
   * Can a new HTML element be inserted into the currently selected element?
   * @return {Boolean}
   */
  canAddHTMLChild: function () {
    const selection = this.selection;

    // Don't allow to insert an element into these elements. This should only
    // contain elements where walker.insertAdjacentHTML has no effect.
    const invalidTagNames = ["html", "iframe"];

    return (
      selection.isHTMLNode() &&
      selection.isElementNode() &&
      !selection.isPseudoElementNode() &&
      !selection.isAnonymousNode() &&
      !invalidTagNames.includes(selection.nodeFront.nodeName.toLowerCase())
    );
  },

  /**
   * Update the state of the add button in the toolbar depending on the current selection.
   */
  updateAddElementButton() {
    const btn = this.panelDoc.getElementById("inspector-element-add-button");
    if (this.canAddHTMLChild()) {
      btn.removeAttribute("disabled");
    } else {
      btn.setAttribute("disabled", "true");
    }
  },

  /**
   * Handler for the "host-changed" event from the toolbox. Resets the inspector
   * sidebar sizes when the toolbox host type changes.
   */
  async onHostChanged() {
    // Eagerly call our resize handling code to process the fact that we
    // switched hosts. If we don't do this, we'll wait for resize events + 200ms
    // to have passed, which causes the old layout to noticeably show up in the
    // new host, followed by the updated one.
    await this._onLazyPanelResize();
    // Note that we may have been destroyed by now, especially in tests, so we
    // need to check if that's happened before touching anything else.
    if (!this.currentTarget || !this.is3PaneModeEnabled) {
      return;
    }

    // When changing hosts, the toolbox chromeEventHandler might change, for instance when
    // switching from docked to window hosts. Recreate the searchbox shortcuts.
    this.searchboxShortcuts.destroy();
    this.createSearchBoxShortcuts();

    this.setSidebarSplitBoxState();
  },

  /**
   * When a new node is selected.
   */
  onNewSelection: function (value, reason) {
    if (reason === "selection-destroy") {
      return;
    }

    this.updateAddElementButton();
    this.updateSelectionCssSelectors();

    const selfUpdate = this.updating("inspector-panel");
    setTimeout(() => {
      try {
        selfUpdate(this.selection.nodeFront);
      } catch (ex) {
        console.error(ex);
      }
    }, 0);
  },

  /**
   * Delay the "inspector-updated" notification while a tool
   * is updating itself.  Returns a function that must be
   * invoked when the tool is done updating with the node
   * that the tool is viewing.
   */
  updating: function (name) {
    if (this._updateProgress && this._updateProgress.node != this.selection.nodeFront) {
      this.cancelUpdate();
    }

    if (!this._updateProgress) {
      // Start an update in progress.
      const self = this;
      this._updateProgress = {
        node: this.selection.nodeFront,
        outstanding: new Set(),
        checkDone: function () {
          if (this !== self._updateProgress) {
            return;
          }
          // Cancel update if there is no `selection` anymore.
          // It can happen if the inspector panel is already destroyed.
          if (!self.selection || this.node !== self.selection.nodeFront) {
            self.cancelUpdate();
            return;
          }
          if (this.outstanding.size !== 0) {
            return;
          }

          self._updateProgress = null;
          self.emit("inspector-updated", name);

          log(`Inspector Updated`);
        },
      };
    }

    const progress = this._updateProgress;
    const done = function () {
      progress.outstanding.delete(done);
      progress.checkDone();
    };
    progress.outstanding.add(done);
    return done;
  },

  /**
   * Cancel notification of inspector updates.
   */
  cancelUpdate: function () {
    this._updateProgress = null;
  },

  /**
   * When a node is deleted, select its parent node or the defaultNode if no
   * parent is found (may happen when deleting an iframe inside which the
   * node was selected).
   */
  onDetached: function (parentNode) {
    this.breadcrumbs.cutAfter(this.breadcrumbs.indexOf(parentNode));
    const nodeFront = parentNode ? parentNode : this._defaultNode;
    this.selection.setNodeFront(nodeFront, { reason: "detached" });
  },

  /**
   * Destroy the inspector.
   */
  destroy: function () {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;

    this._target.threadFront.off("paused", this.handleThreadPaused);
    this._target.threadFront.off("resumed", this.handleThreadResumed);

    if (this.walker) {
      this.walker.off("new-root", this.onNewRoot);
    }

    this.cancelUpdate();

    this.sidebar.destroy();

    this.panelWin.removeEventListener("resize", this.onPanelWindowResize, true);
    this.selection.off("new-node-front", this.onNewSelection);
    this.selection.off("detached-front", this.onDetached);
    this.sidebar.off("select", this.onSidebarSelect);
    this.sidebar.off("show", this.onSidebarShown);
    this.sidebar.off("hide", this.onSidebarHidden);
    this.sidebar.off("destroy", this.onSidebarHidden);
    this.currentTarget.off("will-navigate", this._onBeforeNavigate);

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

    this.sidebar.destroy();
    if (this.ruleViewSideBar) {
      this.ruleViewSideBar.destroy();
    }
    this._destroyMarkup();

    this.teardownToolbar();

    this.breadcrumbs.destroy();
    this.styleChangeTracker.destroy();
    this.searchboxShortcuts.destroy();

    this._is3PaneModeChromeEnabled = null;
    this._is3PaneModeEnabled = null;
    this._markupBox = null;
    this._target = null;
    this._toolbox = null;
    this.breadcrumbs = null;
    this.panelDoc = null;
    this.panelWin.inspector = null;
    this.panelWin = null;
    this.resultsLength = null;
    this.searchBox = null;
    this.show3PaneTooltip = null;
    this.sidebar = null;
    this.store = null;
    this.telemetry = null;
    this._pendingSelection = null;
  },

  _destroyMarkup: function () {
    let destroyPromise;

    if (this.markup) {
      destroyPromise = this.markup.destroy();
      this.markup = null;
    } else {
      destroyPromise = Promise.resolve();
    }

    // Allow showing loading message.
    //this._markupBox.style.visibility = "hidden";

    return destroyPromise;
  },

  onEyeDropperButtonClicked: function () {
    this.eyeDropperButton.classList.contains("checked")
      ? this.hideEyeDropper()
      : this.showEyeDropper();
  },

  startEyeDropperListeners: function () {
    this.toolbox.tellRDMAboutPickerState(true, PICKER_TYPES.EYEDROPPER);
    this.inspectorFront.once("color-pick-canceled", this.onEyeDropperDone);
    this.inspectorFront.once("color-picked", this.onEyeDropperDone);
    this.walker.once("new-root", this.onEyeDropperDone);
  },

  stopEyeDropperListeners: function () {
    this.toolbox.tellRDMAboutPickerState(false, PICKER_TYPES.EYEDROPPER);
    this.inspectorFront.off("color-pick-canceled", this.onEyeDropperDone);
    this.inspectorFront.off("color-picked", this.onEyeDropperDone);
    this.walker.off("new-root", this.onEyeDropperDone);
  },

  onEyeDropperDone: function () {
    this.eyeDropperButton.classList.remove("checked");
    this.stopEyeDropperListeners();
  },

  /**
   * Show the eyedropper on the page.
   * @return {Promise} resolves when the eyedropper is visible.
   */
  showEyeDropper: function () {
    // The eyedropper button doesn't exist, most probably because the actor doesn't
    // support the pickColorFromPage, or because the page isn't HTML.
    if (!this.eyeDropperButton) {
      return null;
    }
    // turn off node picker when color picker is starting
    this.toolbox.nodePicker.stop().catch(console.error);
    this.telemetry.scalarSet(TELEMETRY_EYEDROPPER_OPENED, 1);
    this.eyeDropperButton.classList.add("checked");
    this.startEyeDropperListeners();
    return this.inspectorFront.pickColorFromPage({ copyOnSelect: true }).catch(console.error);
  },

  /**
   * Hide the eyedropper.
   * @return {Promise} resolves when the eyedropper is hidden.
   */
  hideEyeDropper: function () {
    // The eyedropper button doesn't exist, most probably  because the page isn't HTML.
    if (!this.eyeDropperButton) {
      return null;
    }

    this.eyeDropperButton.classList.remove("checked");
    this.stopEyeDropperListeners();
    return this.inspectorFront.cancelPickColorFromPage().catch(console.error);
  },

  /**
   * Create a new node as the last child of the current selection, expand the
   * parent and select the new node.
   */
  async addNode() {
    if (!this.canAddHTMLChild()) {
      return;
    }

    // turn off node picker when add node is triggered
    this.toolbox.nodePicker.stop();

    // turn off color picker when add node is triggered
    this.hideEyeDropper();

    const nodeFront = this.selection.nodeFront;
    const html = "<div></div>";

    // Insert the html and expect a childList markup mutation.
    const onMutations = this.once("markupmutation");
    await nodeFront.walkerFront.insertAdjacentHTML(this.selection.nodeFront, "beforeEnd", html);
    await onMutations;

    // Expand the parent node.
    this.markup.expandNode(nodeFront);
  },

  /**
   * Toggle a pseudo class.
   */
  togglePseudoClass: function (pseudo) {
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
    return promise.resolve();
  },

  /**
   * Initiate screenshot command on selected node.
   */
  async screenshotNode() {
    // Bug 1332936 - it's possible to call `screenshotNode` while the BoxModel highlighter
    // is still visible, therefore showing it in the picture.
    // To avoid that, we have to hide it before taking the screenshot. The `hideBoxModel`
    // will do that, calling `hide` for the highlighter only if previously shown.
    await this.highlighter.hideBoxModel();

    const clipboardEnabled = Services.prefs.getBoolPref("devtools.screenshot.clipboard.enabled");
    const args = {
      file: true,
      nodeActorID: this.selection.nodeFront.actorID,
      clipboard: clipboardEnabled,
    };
    const screenshotFront = await this.currentTarget.getFront("screenshot");
    const screenshot = await screenshotFront.capture(args);
    await saveScreenshot(this.panelWin, args, screenshot);
  },

  /**
   * Returns an object containing the shared handler functions used in the box
   * model and grid React components.
   */
  getCommonComponentProps() {
    return {
      setSelectedNode: this.selection.setNodeFront,
      onShowBoxModelHighlighterForNode: this.onShowBoxModelHighlighterForNode,
    };
  },

  /**
   * Shows the box-model highlighter on the element corresponding to the provided
   * NodeFront.
   *
   * @param  {NodeFront} nodeFront
   *         The node to highlight.
   * @param  {Object} options
   *         Options passed to the highlighter actor.
   */
  onShowBoxModelHighlighterForNode(nodeFront, options) {
    nodeFront.highlighterFront.highlight(nodeFront, options);
  },

  async inspectNodeActor(nodeActor, inspectFromAnnotation) {
    const nodeFront = await this.inspectorFront.getNodeFrontFromNodeGrip({
      actor: nodeActor,
    });
    if (!nodeFront) {
      console.error(
        "The object cannot be linked to the inspector, the " +
          "corresponding nodeFront could not be found."
      );
      return false;
    }

    const isAttached = await this.walker.isInDOMTree(nodeFront);
    if (!isAttached) {
      console.error("Selected DOMNode is not attached to the document tree.");
      return false;
    }

    await this.selection.setNodeFront(nodeFront, {
      reason: inspectFromAnnotation,
    });
    return true;
  },
};

exports.Inspector = Inspector;
