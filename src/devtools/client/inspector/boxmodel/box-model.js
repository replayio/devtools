/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { updateLayout } = require("devtools/client/inspector/boxmodel/actions/box-model");

const Highlighter = require("highlighter/highlighter").default;

const NUMERIC = /^-?[\d\.]+$/;

/**
 * A singleton instance of the box model controllers.
 *
 * @param  {Inspector} inspector
 *         An instance of the Inspector currently loaded in the toolbox.
 * @param  {Window} window
 *         The document window of the toolbox.
 */
function BoxModel(inspector, window) {
  this.document = window.document;
  this.inspector = inspector;
  this.store = inspector.store;

  this.updateBoxModel = this.updateBoxModel.bind(this);

  this.onHideBoxModelHighlighter = this.onHideBoxModelHighlighter.bind(this);
  this.onNewSelection = this.onNewSelection.bind(this);
  this.onShowBoxModelEditor = this.onShowBoxModelEditor.bind(this);
  this.onShowBoxModelHighlighter = this.onShowBoxModelHighlighter.bind(this);
  this.onShowRulePreviewTooltip = this.onShowRulePreviewTooltip.bind(this);
  this.onSidebarSelect = this.onSidebarSelect.bind(this);

  this.inspector.selection.on("new-node-front", this.onNewSelection);
  // this.inspector.sidebar.on("select", this.onSidebarSelect);

  this.onNewSelection();
}

BoxModel.prototype = {
  /**
   * Destruction function called when the inspector is destroyed. Removes event listeners
   * and cleans up references.
   */
  destroy() {
    this.inspector.selection.off("new-node-front", this.onNewSelection);
    // this.inspector.sidebar.off("select", this.onSidebarSelect);

    if (this._tooltip) {
      this._tooltip.destroy();
    }

    this._highlighters = null;
    this._tooltip = null;
    this.document = null;
    this.inspector = null;
  },

  get highlighters() {
    if (!this._highlighters) {
      // highlighters is a lazy getter in the inspector.
      this._highlighters = this.inspector.highlighters;
    }

    return this._highlighters;
  },

  get rulePreviewTooltip() {
    if (!this._tooltip) {
      this._tooltip = new RulePreviewTooltip(this.inspector.toolbox.doc);
    }

    return this._tooltip;
  },

  /**
   * Returns an object containing the box model's handler functions used in the box
   * model's React component props.
   */
  getComponentProps() {
    return {
      onHideBoxModelHighlighter: this.onHideBoxModelHighlighter,
      onShowBoxModelEditor: this.onShowBoxModelEditor,
      onShowBoxModelHighlighter: this.onShowBoxModelHighlighter,
      onShowRulePreviewTooltip: this.onShowRulePreviewTooltip,
    };
  },

  /**
   * Returns true if the layout panel is visible, and false otherwise.
   */
  isPanelVisible() {
    return (
      this.inspector.toolbox &&
      this.inspector.sidebar &&
      this.inspector.toolbox.currentTool === "inspector" &&
      this.inspector.sidebar.getCurrentTabID() === "layoutview"
    );
  },

  /**
   * Returns true if the layout panel is visible and the current element is valid to
   * be displayed in the view.
   */
  isPanelVisibleAndNodeValid() {
    return (
      this.isPanelVisible() &&
      this.inspector.selection.isConnected() &&
      this.inspector.selection.isElementNode()
    );
  },

  /**
   * Updates the box model panel by dispatching the new layout data.
   *
   * @param  {String} reason
   *         Optional string describing the reason why the boxmodel is updated.
   */
  updateBoxModel(reason) {
    this._updateReasons = this._updateReasons || [];
    if (reason) {
      this._updateReasons.push(reason);
    }

    const lastRequest = async function () {
      if (
        !this.inspector ||
        // !this.isPanelVisible() ||
        !this.inspector.selection.isConnected() ||
        !this.inspector.selection.isElementNode()
      ) {
        return null;
      }

      const { nodeFront } = this.inspector.selection;
      const bounds = await nodeFront.getBoundingClientRect();
      const style = await nodeFront.getComputedStyle();

      if (!bounds || !style) {
        return null;
      }

      const layout = {
        width: parseFloat(bounds.width.toPrecision(6)),
        height: parseFloat(bounds.height.toPrecision(6)),
        autoMargins: {},
      };

      for (const prop of [
        "position",
        "top",
        "right",
        "bottom",
        "left",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "border-top-width",
        "border-right-width",
        "border-bottom-width",
        "border-left-width",
        "z-index",
        "box-sizing",
        "display",
        "float",
        "line-height",
      ]) {
        layout[prop] = style.get(prop);
      }

      /*
      // Update the redux store with the latest offset parent DOM node
      const offsetParent = await inspectorFront.walker.getOffsetParent(
        nodeFront
      );
      this.store.dispatch(updateOffsetParent(offsetParent));
      */

      // Update the redux store with the latest layout properties and update the box
      // model view.
      this.store.dispatch(updateLayout(layout));

      // If a subsequent request has been made, wait for that one instead.
      if (this._lastRequest != lastRequest) {
        return this._lastRequest;
      }

      this.inspector.emit("boxmodel-view-updated", this._updateReasons);

      this._lastRequest = null;
      this._updateReasons = [];

      return null;
    }
      .bind(this)()
      .catch(error => {
        // If we failed because we were being destroyed while waiting for a request, ignore.
        if (this.document) {
          console.error(error);
        }
      });

    this._lastRequest = lastRequest;
  },

  /**
   * Hides the box-model highlighter on the currently selected element.
   */
  onHideBoxModelHighlighter() {
    Highlighter.unhighlight();
  },

  /**
   * Selection 'new-node-front' event handler.
   */
  onNewSelection() {
    // if (!this.isPanelVisibleAndNodeValid()) {
    //   return;
    // }

    this.updateBoxModel("new-selection");
  },

  /**
   * Shows the RulePreviewTooltip when a box model editable value is hovered on the
   * box model panel.
   *
   * @param  {Element} target
   *         The target element.
   * @param  {String} property
   *         The name of the property.
   */
  onShowRulePreviewTooltip(target, property) {
    const { highlightProperty } = this.inspector.getPanel("ruleview").view;
    const isHighlighted = highlightProperty(property);

    // Only show the tooltip if the property is not highlighted.
    // TODO: In the future, use an associated ruleId for toggling the tooltip instead of
    // the Boolean returned from highlightProperty.
    if (!isHighlighted) {
      this.rulePreviewTooltip.show(target);
    }
  },

  /**
   * Shows the inplace editor when a box model editable value is clicked on the
   * box model panel.
   *
   * @param  {DOMNode} element
   *         The element that was clicked.
   * @param  {Event} event
   *         The event object.
   * @param  {String} property
   *         The name of the property.
   */
  onShowBoxModelEditor(element, event, property) {
    const session = new EditingSession({
      inspector: this.inspector,
      doc: this.document,
      elementRules: this.elementRules,
    });
    const initialValue = session.getProperty(property);

    const editor = new InplaceEditor(
      {
        element: element,
        initial: initialValue,
        contentType: InplaceEditor.CONTENT_TYPES.CSS_VALUE,
        property: {
          name: property,
        },
        start: self => {
          self.elt.parentNode.classList.add("boxmodel-editing");
        },
        change: value => {
          if (NUMERIC.test(value)) {
            value += "px";
          }

          const properties = [{ name: property, value: value }];

          if (property.substring(0, 7) == "border-") {
            const bprop = property.substring(0, property.length - 5) + "style";
            const style = session.getProperty(bprop);
            if (!style || style == "none" || style == "hidden") {
              properties.push({ name: bprop, value: "solid" });
            }
          }

          if (property.substring(0, 9) == "position-") {
            properties[0].name = property.substring(9);
          }

          session.setProperties(properties).catch(console.error);
        },
        done: (value, commit) => {
          editor.elt.parentNode.classList.remove("boxmodel-editing");
          if (!commit) {
            session.revert().then(() => {
              session.destroy();
            }, console.error);
            return;
          }

          this.updateBoxModel("editable-value-change");
        },
        cssProperties: this.inspector.cssProperties,
      },
      event
    );
  },

  /**
   * Shows the box-model highlighter on the currently selected element.
   *
   * @param  {Object} options
   *         Options passed to the highlighter actor.
   */
  onShowBoxModelHighlighter(options = {}) {
    if (!this.inspector) {
      return;
    }

    const { nodeFront } = this.inspector.selection;
    Highlighter.highlight(nodeFront, options);
  },

  /**
   * Handler for the inspector sidebar select event. Starts tracking reflows if the
   * layout panel is visible. Otherwise, stop tracking reflows. Finally, refresh the box
   * model view if it is visible.
   */
  onSidebarSelect() {
    if (!this.isPanelVisible()) {
      return;
    }

    this.updateBoxModel();
  },
};

module.exports = BoxModel;
