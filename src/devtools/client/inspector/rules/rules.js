/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const ElementStyle = require("devtools/client/inspector/rules/models/element-style").default;
const { OutputParser } = require("devtools/client/shared/output-parser");
const { createFactory, createElement } = require("react");
const { Provider } = require("react-redux");
const EventEmitter = require("devtools/shared/event-emitter");
const ClassList = require("devtools/client/inspector/rules/models/class-list").default;
const { getNodeInfo } = require("devtools/client/inspector/rules/utils/utils");
const StyleInspectorMenu = require("devtools/client/inspector/shared/style-inspector-menu");
const { advanceValidate } = require("devtools/client/inspector/shared/utils");
const AutocompletePopup = require("devtools/client/shared/autocomplete-popup");
const { InplaceEditor } = require("devtools/client/shared/inplace-editor");

const {
  updateClasses,
  updateClassPanelExpanded,
} = require("devtools/client/inspector/rules/actions/class-list");
const { togglePseudoClass } = require("devtools/client/inspector/rules/actions/pseudo-classes");
const {
  updateHighlightedSelector,
  updateRules,
} = require("devtools/client/inspector/rules/actions/rules");
const { setComputedProperties } = require("devtools/client/inspector/computed/actions");

const RulesApp = createFactory(require("devtools/client/inspector/rules/components/RulesApp"));

const PREF_UA_STYLES = "devtools.inspector.showUserAgentStyles";

class RulesView {
  constructor(inspector, window) {
    this.cssProperties = inspector.cssProperties;
    this.doc = window.document;
    this.inspector = inspector;
    this.selection = inspector.selection;
    this.store = inspector.store;
    this.toolbox = inspector.toolbox;
    this.isNewRulesView = true;

    this.outputParser = new OutputParser(this.doc, this.cssProperties);
    this.showUserAgentStyles = Services.prefs.getBoolPref(PREF_UA_STYLES);

    this.onAddClass = this.onAddClass.bind(this);
    this.onAddRule = this.onAddRule.bind(this);
    this.onSelection = this.onSelection.bind(this);
    this.onSetClassState = this.onSetClassState.bind(this);
    this.onToggleClassPanelExpanded = this.onToggleClassPanelExpanded.bind(this);
    this.onToggleDeclaration = this.onToggleDeclaration.bind(this);
    this.onTogglePseudoClass = this.onTogglePseudoClass.bind(this);
    this.onToggleSelectorHighlighter = this.onToggleSelectorHighlighter.bind(this);
    this.showContextMenu = this.showContextMenu.bind(this);
    this.showDeclarationNameEditor = this.showDeclarationNameEditor.bind(this);
    this.showDeclarationValueEditor = this.showDeclarationValueEditor.bind(this);
    this.showNewDeclarationEditor = this.showNewDeclarationEditor.bind(this);
    this.showSelectorEditor = this.showSelectorEditor.bind(this);
    this.updateClassList = this.updateClassList.bind(this);
    this.updateRules = this.updateRules.bind(this);

    // this.inspector.sidebar.on("select", this.onSelection);
    this.selection.on("detached-front", this.onSelection);
    this.selection.on("new-node-front", this.onSelection);

    EventEmitter.decorate(this);

    this.onSelection();
  }

  getRulesProps() {
    return {
      onAddClass: this.onAddClass,
      onAddRule: this.onAddRule,
      onSetClassState: this.onSetClassState,
      onToggleClassPanelExpanded: this.onToggleClassPanelExpanded,
      onToggleDeclaration: this.onToggleDeclaration,
      onTogglePseudoClass: this.onTogglePseudoClass,
      onToggleSelectorHighlighter: this.onToggleSelectorHighlighter,
      showContextMenu: this.showContextMenu,
      showDeclarationNameEditor: this.showDeclarationNameEditor,
      showDeclarationValueEditor: this.showDeclarationValueEditor,
      showNewDeclarationEditor: this.showNewDeclarationEditor,
      showSelectorEditor: this.showSelectorEditor,
    };
  }

  destroy() {
    // this.inspector.sidebar.off("select", this.onSelection);
    this.selection.off("detached-front", this.onSelection);
    this.selection.off("new-node-front", this.onSelection);

    if (this._autocompletePopup) {
      this._autocompletePopup.destroy();
      this._autocompletePopup = null;
    }

    if (this._classList) {
      this._classList.off("current-node-class-changed", this.refreshClassList);
      this._classList.destroy();
      this._classList = null;
    }

    if (this._contextMenu) {
      this._contextMenu.destroy();
      this._contextMenu = null;
    }

    if (this._selectHighlighter) {
      this._selectorHighlighter.finalize();
      this._selectorHighlighter = null;
    }

    if (this.elementStyle) {
      this.elementStyle.destroy();
      this.elementStyle = null;
    }

    this._dummyElement = null;
    this.cssProperties = null;
    this.doc = null;
    this.inspector = null;
    this.outputParser = null;
    this.pageStyle = null;
    this.selection = null;
    this.showUserAgentStyles = null;
    this.store = null;
    this.toolbox = null;
  }

  /**
   * Get an instance of the AutocompletePopup.
   *
   * @return {AutocompletePopup}
   */
  get autocompletePopup() {
    if (!this._autocompletePopup) {
      this._autocompletePopup = new AutocompletePopup(this.doc, {
        autoSelect: true,
        theme: "auto",
      });
    }

    return this._autocompletePopup;
  }

  /**
   * Get an instance of the ClassList model used to manage the list of CSS classes
   * applied to the element.
   *
   * @return {ClassList} used to manage the list of CSS classes applied to the element.
   */
  get classList() {
    if (!this._classList) {
      this._classList = new ClassList(this.inspector);
    }

    return this._classList;
  }

  get contextMenu() {
    if (!this._contextMenu) {
      this._contextMenu = new StyleInspectorMenu(this, { isRuleView: true });
    }

    return this._contextMenu;
  }

  /**
   * Get the current target the toolbox is debugging.
   *
   * @return {Target}
   */
  get currentTarget() {
    return this.inspector.currentTarget;
  }

  /**
   * Creates a dummy element in the document that helps get the computed style in
   * TextProperty.
   *
   * @return {Element} used to get the computed style for text properties.
   */
  get dummyElement() {
    // To figure out how shorthand properties are interpreted by the
    // engine, we will set properties on a dummy element and observe
    // how their .style attribute reflects them as computed values.
    if (!this._dummyElement) {
      this._dummyElement = this.doc.createElement("div");
    }

    return this._dummyElement;
  }

  /**
   * Get the highlighters overlay from the Inspector.
   *
   * @return {HighlighterOverlay}.
   */
  get highlighters() {
    return this.inspector.highlighters;
  }

  get view() {
    return this;
  }

  /**
   * Get the type of a given node in the Rules view.
   *
   * @param {DOMNode} node
   *        The node which we want information about.
   * @return {Object|null} containing the following props:
   * - rule {Rule} The Rule object.
   * - type {String} One of the VIEW_NODE_XXX_TYPE const in
   *   client/inspector/shared/node-types.
   * - value {Object} Depends on the type of the node.
   * - view {String} Always "rule" to indicate the rule view.
   * Otherwise, returns null if the node isn't anything we care about.
   */
  getNodeInfo(node) {
    return getNodeInfo(node, this.elementStyle);
  }

  /**
   * Get an instance of SelectorHighlighter (used to highlight nodes that match
   * selectors in the rule-view).
   *
   * @return {Promise} resolves to the instance of the highlighter.
   */
  async getSelectorHighlighter() {
    if (!this.inspector) {
      return null;
    }

    if (this._selectorHighlighter) {
      return this._selectorHighlighter;
    }

    try {
      const front = this.inspector.inspectorFront;
      this._selectorHighlighter = await front.getHighlighterByType("SelectorHighlighter");
      return this._selectorHighlighter;
    } catch (e) {
      // The SelectorHighlighter type could not be created in the
      // current target. It could be an older server, or a XUL page.
      return null;
    }
  }

  /**
   * Returns true if the rules panel is visible, and false otherwise.
   */
  isPanelVisible() {
    return this.inspector?.toolbox?.currentTool === "inspector";
    // return this.inspector.is3PaneModeEnabled
    //   ? true
    //   : this.inspector?.sidebar?.getCurrentTabID() === "newruleview";
  }

  /**
   * Handler for adding the given CSS class value to the current element's class list.
   *
   * @param  {String} value
   *         The string that contains all classes.
   */
  async onAddClass(value) {
    await this.classList.addClassName(value);
    this.updateClassList();
  }

  /**
   * Handler for adding a new CSS rule.
   */
  async onAddRule() {
    await this.elementStyle.addNewRule();
  }

  /**
   * Handler for selection events "detached-front" and "new-node-front" and inspector
   * sidbar "select" event. Updates the rules view with the selected node if the panel
   * is visible.
   */
  onSelection() {
    if (!this.isPanelVisible()) {
      return;
    }

    if (!this.selection.isConnected() || !this.selection.isElementNode()) {
      this.update();
      return;
    }

    this.update(this.selection.nodeFront);
  }

  /**
   * Handler for toggling a CSS class from the current element's class list. Sets the
   * state of given CSS class name to the given checked value.
   *
   * @param  {String} name
   *         The CSS class name.
   * @param  {Boolean} checked
   *         Whether or not the given CSS class is checked.
   */
  async onSetClassState(name, checked) {
    await this.classList.setClassState(name, checked);
    this.updateClassList();
  }

  /**
   * Handler for toggling the expanded property of the class list panel.
   *
   * @param  {Boolean} isClassPanelExpanded
   *         Whether or not the class list panel is expanded.
   */
  onToggleClassPanelExpanded(isClassPanelExpanded) {
    if (isClassPanelExpanded) {
      this.classList.on("current-node-class-changed", this.updateClassList);
    } else {
      this.classList.off("current-node-class-changed", this.updateClassList);
    }

    this.store.dispatch(updateClassPanelExpanded(isClassPanelExpanded));
  }

  /**
   * Handler for toggling the enabled property for a given CSS declaration.
   *
   * @param  {String} ruleId
   *         The Rule id of the given CSS declaration.
   * @param  {String} declarationId
   *         The TextProperty id for the CSS declaration.
   */
  onToggleDeclaration(ruleId, declarationId) {
    this.elementStyle.toggleDeclaration(ruleId, declarationId);
  }

  /**
   * Handler for toggling a pseudo class in the pseudo class panel. Toggles on and off
   * a given pseudo class value.
   *
   * @param  {String} value
   *         The pseudo class to toggle on or off.
   */
  // onTogglePseudoClass(value) {
  //   this.store.dispatch(togglePseudoClass(value));
  //   this.inspector.togglePseudoClass(value);
  // }

  /**
   * Handler for toggling the selector highlighter for the given selector.
   * Highlight/unhighlight all the nodes that match a given set of selectors inside the
   * document of the current selected node. Only one selector can be highlighted at a
   * time, so calling the method a second time with a different selector will first
   * unhighlight the previously highlighted nodes. Calling the method a second time with
   * the same select will unhighlight the highlighted nodes.
   *
   * @param  {String} selector
   *         The selector used to find nodes in the page.
   */
  async onToggleSelectorHighlighter(selector) {
    const highlighter = await this.getSelectorHighlighter();
    if (!highlighter) {
      return;
    }

    await highlighter.hide();

    if (selector !== this.highlighters.selectorHighlighterShown) {
      this.store.dispatch(updateHighlightedSelector(selector));

      await highlighter.show(this.selection.nodeFront, {
        hideInfoBar: true,
        hideGuides: true,
        selector,
      });

      this.highlighters.selectorHighlighterShown = selector;
      // This event is emitted for testing purposes.
      this.emit("ruleview-selectorhighlighter-toggled", true);
    } else {
      this.highlighters.selectorHighlighterShown = null;
      this.store.dispatch(updateHighlightedSelector(""));
      // This event is emitted for testing purposes.
      this.emit("ruleview-selectorhighlighter-toggled", false);
    }
  }

  /**
   * Handler for showing the context menu.
   */
  showContextMenu(event) {
    this.contextMenu.show(event);
  }

  /**
   * Handler for showing the inplace editor when an editable property name is clicked in
   * the rules view.
   *
   * @param  {DOMNode} element
   *         The declaration name span element to be edited.
   * @param  {String} ruleId
   *         The id of the Rule object to be edited.
   * @param  {String} declarationId
   *         The id of the TextProperty object to be edited.
   */
  showDeclarationNameEditor(element, ruleId, declarationId) {
    new InplaceEditor({
      advanceChars: ":",
      contentType: InplaceEditor.CONTENT_TYPES.CSS_PROPERTY,
      cssProperties: this.cssProperties,
      done: async (name, commit) => {
        if (!commit) {
          return;
        }

        await this.elementStyle.modifyDeclarationName(ruleId, declarationId, name);
      },
      element,
      popup: this.autocompletePopup,
    });
  }

  /**
   * Handler for showing the inplace editor when an editable property value is clicked
   * in the rules view.
   *
   * @param  {DOMNode} element
   *         The declaration value span element to be edited.
   * @param  {String} ruleId
   *         The id of the Rule object to be edited.
   * @param  {String} declarationId
   *         The id of the TextProperty object to be edited.
   */
  showDeclarationValueEditor(element, ruleId, declarationId) {
    const rule = this.elementStyle.getRule(ruleId);
    if (!rule) {
      return;
    }

    const declaration = rule.getDeclaration(declarationId);
    if (!declaration) {
      return;
    }

    new InplaceEditor({
      advanceChars: advanceValidate,
      contentType: InplaceEditor.CONTENT_TYPES.CSS_VALUE,
      cssProperties: this.cssProperties,
      cssVariables: this.elementStyle.variablesMap.get(rule.pseudoElement) || [],
      defaultIncrement: declaration.name === "opacity" ? 0.1 : 1,
      done: async (value, commit) => {
        if (!commit || !value || !value.trim()) {
          return;
        }

        await this.elementStyle.modifyDeclarationValue(ruleId, declarationId, value);
      },
      element,
      maxWidth: () => {
        // Return the width of the closest declaration container element.
        const containerElement = element.closest(".ruleview-propertycontainer");
        return containerElement.getBoundingClientRect().width;
      },
      multiline: true,
      popup: this.autocompletePopup,
      property: declaration,
      showSuggestCompletionOnEmpty: true,
    });
  }

  /**
   * Shows the new inplace editor for a new declaration.
   *
   * @param  {DOMNode} element
   *         A new declaration span element to be edited.
   * @param  {String} ruleId
   *         The id of the Rule object to be edited.
   * @param  {Function} callback
   *         A callback function that is called when the inplace editor is destroyed.
   */
  showNewDeclarationEditor(element, ruleId, callback) {
    new InplaceEditor({
      advanceChars: ":",
      contentType: InplaceEditor.CONTENT_TYPES.CSS_PROPERTY,
      cssProperties: this.cssProperties,
      destroy: () => {
        callback();
      },
      done: (value, commit) => {
        if (!commit || !value || !value.trim()) {
          return;
        }

        this.elementStyle.addNewDeclaration(ruleId, value);
      },
      element,
      popup: this.autocompletePopup,
    });
  }

  /**
   * Shows the inplace editor for the a selector.
   *
   * @param  {DOMNode} element
   *         The selector's span element to show the inplace editor.
   * @param  {String} ruleId
   *         The id of the Rule to be modified.
   */
  showSelectorEditor(element, ruleId) {
    new InplaceEditor({
      element,
      done: async (value, commit) => {
        if (!value || !commit) {
          return;
        }

        // Hide the selector highlighter if it matches the selector being edited.
        if (this.highlighters.selectorHighlighterShown) {
          const selector = await this.elementStyle.getRule(ruleId).getUniqueSelector();
          if (this.highlighters.selectorHighlighterShown === selector) {
            this.onToggleSelectorHighlighter(this.highlighters.selectorHighlighterShown);
          }
        }

        await this.elementStyle.modifySelector(ruleId, value);
      },
    });
  }

  /**
   * Updates the rules view by dispatching the new rules data of the newly selected
   * element. This is called when the rules view becomes visible or upon new node
   * selection.
   *
   * @param  {NodeFront|null} element
   *         The NodeFront of the current selected element.
   */
  async update(element) {
    if (this.elementStyle) {
      this.elementStyle.destroy();
    }

    if (!element) {
      // this.store.dispatch(disableAllPseudoClasses());
      // this.store.dispatch(updateAddRuleEnabled(false));
      // this.store.dispatch(updateClasses([]));
      this.store.dispatch(updateRules([]));
      return;
    }

    this.pageStyle = undefined;
    this.elementStyle = new ElementStyle(
      element,
      this,
      {},
      this.pageStyle,
      this.showUserAgentStyles
    );
    this.elementStyle.onChanged = this.updateRules;

    await this.updateElementStyle();
  }

  /**
   * Updates the class list panel with the current list of CSS classes.
   */
  updateClassList() {
    this.store.dispatch(updateClasses(this.classList.currentClasses));
  }

  /**
   * Updates the list of rules for the selected element. This should be called after
   * ElementStyle is initialized or if the list of rules for the selected element needs
   * to be refresh (e.g. when print media simulation is toggled).
   */
  async updateElementStyle() {
    // Updating the style panels can take more than 100ms and blocks the browser from
    // rendering the updated markup panel, so we add a tiny delay here to give the browser
    // an opportunity to render.
    await new Promise(resolve => setTimeout(resolve, 0));

    await this.elementStyle.populate();

    // const isAddRuleEnabled = this.selection.isElementNode() && !this.selection.isAnonymousNode();
    // this.store.dispatch(updateAddRuleEnabled(isAddRuleEnabled));
    // this.store.dispatch(setPseudoClassLocks(this.elementStyle.element.pseudoClassLocks));
    // this.updateClassList();
    this.updateRules();
  }

  /**
   * Updates the rules view by dispatching the current rules state. This is called from
   * the update() function, and from the ElementStyle's onChange() handler.
   */
  updateRules() {
    this.store.dispatch(updateRules(this.elementStyle.rules));
    this.store.dispatch(setComputedProperties(this.elementStyle));
  }
}

module.exports = RulesView;
