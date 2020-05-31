/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { PureComponent } = require("react");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");

/**
 * This component is intended to show tick labels on the header.
 */
class TickLabels extends PureComponent {
  static get propTypes() {
    return {
      ticks: PropTypes.array.isRequired,
    };
  }

  render() {
    const { ticks } = this.props;

    return dom.div(
      {
        className: "tick-labels",
      },
      ticks.map(tick =>
        dom.div(
          {
            className: "tick-label",
            style: {
              marginInlineStart: `${tick.position}%`,
              maxWidth: `${tick.width}px`,
            },
          },
          tick.label
        )
      )
    );
  }
}

module.exports = TickLabels;
