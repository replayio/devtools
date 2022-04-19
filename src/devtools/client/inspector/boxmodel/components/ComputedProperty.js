/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { LocalizationHelper } = require("devtools/shared/l10n");
const PropTypes = require("prop-types");
const { PureComponent } = require("react");
const dom = require("react-dom-factories");

const BOXMODEL_STRINGS_URI = "devtools/client/locales/boxmodel.properties";
const BOXMODEL_L10N = new LocalizationHelper(BOXMODEL_STRINGS_URI);

class ComputedProperty extends PureComponent {
  static get propTypes() {
    return {
      name: PropTypes.string.isRequired,
      onHideBoxModelHighlighter: PropTypes.func,
      onShowBoxModelHighlighterForNode: PropTypes.func,
      referenceElement: PropTypes.object,
      referenceElementType: PropTypes.string,
      setSelectedNode: PropTypes.func,
      value: PropTypes.string,
    };
  }

  constructor(props) {
    super(props);

    this.onFocus = this.onFocus.bind(this);
    this.renderReferenceElementPreview = this.renderReferenceElementPreview.bind(this);
  }

  onFocus() {
    this.container.focus();
  }

  renderReferenceElementPreview() {
    const {
      onShowBoxModelHighlighterForNode,
      onHideBoxModelHighlighter,
      referenceElement,
      referenceElementType,
      setSelectedNode,
    } = this.props;

    if (!referenceElement) {
      return null;
    }

    return dom.div(
      { className: "reference-element" },
      dom.span(
        {
          className: "reference-element-type",
          title: "Offset parent of the selected element",
        },
        referenceElementType
      ),
      getNodeRep(referenceElement, {
        onDOMNodeMouseOut: () => onHideBoxModelHighlighter(),
        onDOMNodeMouseOver: () => onShowBoxModelHighlighterForNode(referenceElement),
        onInspectIconClick: () => setSelectedNode(referenceElement, { reason: "box-model" }),
      })
    );
  }

  render() {
    const { name, value } = this.props;

    return dom.div(
      {
        className: "computed-property-view",
        "data-property-name": name,
        ref: container => {
          this.container = container;
        },
        tabIndex: "0",
      },
      dom.div(
        { className: "computed-property-name-container" },
        dom.div(
          {
            className: "computed-property-name theme-fg-color3",
            onClick: this.onFocus,
            tabIndex: "",
            title: name,
          },
          name
        )
      ),
      dom.div(
        { className: "computed-property-value-container" },
        dom.div(
          {
            className: "computed-property-value theme-fg-color1",
            dir: "ltr",
            onClick: this.onFocus,
            tabIndex: "",
          },
          value
        ),
        this.renderReferenceElementPreview()
      )
    );
  }
}

module.exports = ComputedProperty;
