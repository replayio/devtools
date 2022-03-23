/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

const BoxModelInfo = require("devtools/client/inspector/boxmodel/components/BoxModelInfo");
const BoxModelMain = require("devtools/client/inspector/boxmodel/components/BoxModelMain");
const BoxModelProperties = require("devtools/client/inspector/boxmodel/components/BoxModelProperties");

const Types = require("devtools/client/inspector/boxmodel/types");

class BoxModel extends React.PureComponent {
  static get propTypes() {
    return {
      boxModel: PropTypes.shape(Types.boxModel).isRequired,
      onHideBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelEditor: PropTypes.func.isRequired,
      onShowBoxModelHighlighter: PropTypes.func.isRequired,
      onShowBoxModelHighlighterForNode: PropTypes.func.isRequired,
      onShowRulePreviewTooltip: PropTypes.func.isRequired,
      showBoxModelProperties: PropTypes.bool.isRequired,
      setSelectedNode: PropTypes.func.isRequired,
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
        tabIndex: 0,
        ref: div => {
          this.boxModelContainer = div;
        },
        onKeyDown: this.onKeyDown,
      },
      React.createElement(BoxModelMain, {
        boxModel,
        boxModelContainer: this.boxModelContainer,
        ref: boxModelMain => {
          this.boxModelMain = boxModelMain;
        },
        onHideBoxModelHighlighter,
        onShowBoxModelEditor,
        onShowBoxModelHighlighter,
        onShowRulePreviewTooltip,
      }),
      React.createElement(BoxModelInfo, {
        boxModel,
      }),
      showBoxModelProperties
        ? React.createElement(BoxModelProperties, {
            boxModel,
            setSelectedNode,
            onHideBoxModelHighlighter,
            onShowBoxModelHighlighterForNode,
          })
        : null
    );
  }
}

module.exports = BoxModel;
