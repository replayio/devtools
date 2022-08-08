/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("devtools/shared/services");

const { getNodeInfo } = require("devtools/client/inspector/rules/utils/utils");
import { selection } from "devtools/client/framework/selection";
const ElementStyle = require("devtools/client/inspector/rules/models/element-style").default;

const { rulesUpdated } = require("devtools/client/inspector/rules/reducers/rules");
const { setComputedProperties } = require("devtools/client/inspector/computed/actions");

import { getSelectedPanel } from "ui/reducers/layout";

const PREF_UA_STYLES = "devtools.inspector.showUserAgentStyles";

class RulesView {
  constructor(inspector) {
    this.store = inspector.store;

    this.showUserAgentStyles = Services.prefs.getBoolPref(PREF_UA_STYLES);

    selection.on("new-node-front", this.onSelection);

    this.onSelection();
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
      this.store.dispatch(rulesUpdated([]));
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

    this.updateRules();
  }

  /**
   * Updates the rules view by dispatching the current rules state. This is called from
   * the update() function, and from the ElementStyle's onChange() handler.
   */
  updateRules() {
    this.store.dispatch(rulesUpdated(this.elementStyle.rules));
    this.store.dispatch(setComputedProperties(this.elementStyle));
  }
}

module.exports = RulesView;
