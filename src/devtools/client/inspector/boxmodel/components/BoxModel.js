/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const BoxModelInfo = require("devtools/client/inspector/boxmodel/components/BoxModelInfo");
const BoxModelMain = require("devtools/client/inspector/boxmodel/components/BoxModelMain");
const BoxModelProperties = require("devtools/client/inspector/boxmodel/components/BoxModelProperties");
const Types = require("devtools/client/inspector/boxmodel/types");
const PropTypes = require("prop-types");
const React = require("react");
const dom = require("react-dom-factories");

class BoxModel extends React.PureComponent {
  static get propTypes() {
    return {
      boxModel: PropTypes.shape(Types.boxModel).isRequired,
      onHideBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelEditor: PropTypes.func.isRequired,
      onShowBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelHighlighterForNode: PropTypes.func.isRequired,
      onShowRulePreviewTooltip: PropTypes.func.isRequired,
      setSelectedNode: PropTypes.func.isRequired,
      showBoxModelProperties: PropTypes.bool.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onKeyDown(event) {
    const { target } = event;

    if (target == this.boxModelContainer) {
      this.boxModelMain.onKeyDown(event);
    }
  }

  render() {
    const {
      boxModel,
      onHideBoxModelHighlighter,
      onShowBoxModelEditor,
      onShowBoxModelHighlighter,
      onShowBoxModelHighlighterForNode,
      onShowRulePreviewTooltip,
      setSelectedNode,
      showBoxModelProperties,
    } = this.props;

    return dom.div(
      {
        className: "boxmodel-container",
        onKeyDown: this.onKeyDown,
        ref: div => {
          this.boxModelContainer = div;
        },
        tabIndex: 0,
      },
      React.createElement(BoxModelMain, {
        boxModel,
        boxModelContainer: this.boxModelContainer,
        onHideBoxModelHighlighter,
        onShowBoxModelEditor,
        onShowBoxModelHighlighter,
        onShowRulePreviewTooltip,
        ref: boxModelMain => {
          this.boxModelMain = boxModelMain;
        },
      }),
      React.createElement(BoxModelInfo, {
        boxModel,
      }),
      showBoxModelProperties
        ? React.createElement(BoxModelProperties, {
            boxModel,
            onHideBoxModelHighlighter,
            onShowBoxModelHighlighterForNode,
            setSelectedNode,
          })
        : null
    );
  }
}

module.exports = BoxModel;
