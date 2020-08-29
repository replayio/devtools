/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { PureComponent } = require("react");
const dom = require("react-dom-factories");
const PropTypes = require("prop-types");

const Types = require("devtools/client/inspector/rules/types");

class SourceLink extends PureComponent {
  static get propTypes() {
    return {
      id: PropTypes.string.isRequired,
      isUserAgentStyle: PropTypes.bool.isRequired,
      sourceLink: PropTypes.shape(Types.sourceLink).isRequired,
      type: PropTypes.number.isRequired,
    };
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { label, title } = this.props.sourceLink;

    return dom.div(
      {
        className: "ruleview-rule-source theme-link",
      },
      dom.span(
        {
          className: "ruleview-rule-source-label",
          title,
        },
        label
      )
    );
  }
}

module.exports = SourceLink;
