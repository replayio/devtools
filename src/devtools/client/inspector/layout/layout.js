/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { createFactory, createElement } = require("react");
const { Provider } = require("react-redux");

const LayoutApp = createFactory(require("devtools/client/inspector/layout/components/LayoutApp"));

const { LocalizationHelper } = require("devtools/shared/l10n");
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");

class LayoutView {
  constructor(inspector, window) {
    this.document = window.document;
    this.inspector = inspector;
    this.store = inspector.store;

    this.init();
  }

  init() {
    if (!this.inspector) {
      return;
    }

    const {
      onShowBoxModelHighlighterForNode,
      setSelectedNode,
    } = this.inspector.getCommonComponentProps();

    const {
      onHideBoxModelHighlighter,
      onShowBoxModelEditor,
      onShowBoxModelHighlighter,
      onShowRulePreviewTooltip,
    } = this.inspector.getPanel("boxmodel").getComponentProps();

    const layoutApp = LayoutApp({
      onHideBoxModelHighlighter,
      onShowBoxModelEditor,
      onShowBoxModelHighlighter,
      onShowBoxModelHighlighterForNode,
      onShowRulePreviewTooltip,
      setSelectedNode,
      /**
       * Shows the box model properties under the box model if true, otherwise, hidden by
       * default.
       */
      showBoxModelProperties: true,
    });

    const provider = createElement(
      Provider,
      {
        id: "layoutview",
        key: "layoutview",
        store: this.store,
        title: INSPECTOR_L10N.getStr("inspector.sidebar.layoutViewTitle2"),
      },
      layoutApp
    );

    // Expose the provider to let inspector.js use it in setupSidebar.
    this.provider = provider;
  }

  /**
   * Destruction function called when the inspector is destroyed. Cleans up references.
   */
  destroy() {
    this.document = null;
    this.inspector = null;
    this.store = null;
  }
}

module.exports = LayoutView;
