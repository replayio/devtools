/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("devtools/shared/services");
const { OutputParser } = require("packages/third-party/css/output-parser");
const EventEmitter = require("devtools/shared/event-emitter");
const { getNodeInfo } = require("devtools/client/inspector/rules/utils/utils");
import { selection } from "devtools/client/framework/selection";
const ElementStyle = require("devtools/client/inspector/rules/models/element-style").default;

const { updateClasses } = require("devtools/client/inspector/rules/actions/class-list");
const { updateRules } = require("devtools/client/inspector/rules/actions/rules");
const { setComputedProperties } = require("devtools/client/inspector/computed/actions");

import { getSelectedPanel } from "ui/reducers/layout";

const PREF_UA_STYLES = "devtools.inspector.showUserAgentStyles";

class RulesView {
  constructor(inspector, window) {
    this.cssProperties = inspector.cssProperties;
    this.doc = window.document;
    this.inspector = inspector;
    this.store = inspector.store;
    this.isNewRulesView = true;

    this.outputParser = new OutputParser(this.doc, this.cssProperties);
    this.showUserAgentStyles = Services.prefs.getBoolPref(PREF_UA_STYLES);

    // this.inspector.sidebar.on("select", this.onSelection);
    selection.on("detached-front", this.onSelection);
    selection.on("new-node-front", this.onSelection);

    EventEmitter.decorate(this);

    this.onSelection();
  }

  /**
   * Get the current target the toolbox is debugging.
   *
   * @return {Target}
   */
  get currentTarget() {
    return this.inspector.currentTarget;
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
   * Returns true if the rules panel is visible, and false otherwise.
   */
  isPanelVisible() {
    const currentTool = getSelectedPanel(this.store.getState());
    return currentTool === "inspector";
  }

  /**
   * Handler for selection events "detached-front" and "new-node-front" and inspector
   * sidbar "select" event. Updates the rules view with the selected node if the panel
   * is visible.
   */
  onSelection = () => {
    if (!this.isPanelVisible()) {
      return;
    }

    if (!selection.isConnected() || !selection.isElementNode()) {
      this.update();
      return;
    }

    this.update(selection.nodeFront);
  };

  update = async element => {
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
  };

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
