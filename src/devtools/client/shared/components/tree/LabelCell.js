/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// Make this available to both AMD and CJS environments
define(function (require, exports, module) {
  const { Component } = require("react");
  const dom = require("react-dom-factories");
  const PropTypes = require("prop-types");

  /**
   * Render the default cell used for toggle buttons
   */
  class LabelCell extends Component {
    // See the TreeView component for details related
    // to the 'member' object.
    static get propTypes() {
      return {
        id: PropTypes.string.isRequired,
        member: PropTypes.object.isRequired,
        renderSuffix: PropTypes.func,
        title: PropTypes.string,
      };
    }

    render() {
      const id = this.props.id;
      const title = this.props.title;
      const member = this.props.member;
      const level = member.level || 0;
      const renderSuffix = this.props.renderSuffix;

      const iconClassList = ["treeIcon"];
      if (member.hasChildren && member.loading) {
        iconClassList.push("devtools-throbber");
      } else if (member.hasChildren) {
        iconClassList.push("theme-twisty");
      }
      if (member.open) {
        iconClassList.push("open");
      }

      return dom.td(
        {
          className: "treeLabelCell",
          key: "default",
          role: "presentation",
          style: {
            // Compute indentation dynamically. The deeper the item is
            // inside the hierarchy, the bigger is the left padding.
            "--tree-label-cell-indent": `${level * 16}px`,
          },
          title,
        },
        dom.span({
          className: iconClassList.join(" "),
          role: "presentation",
        }),
        dom.span(
          {
            "aria-labelledby": id,
            className: "treeLabel " + member.type + "Label",
            "data-level": level,
            title,
          },
          member.name
        ),
        renderSuffix && renderSuffix(member)
      );
    }
  }

  // Exports from this module
  module.exports = LabelCell;
});
