/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Types = require("devtools/client/inspector/boxmodel/types");
const { LocalizationHelper } = require("devtools/shared/l10n");
const PropTypes = require("prop-types");
const { PureComponent } = require("react");
const dom = require("react-dom-factories");

const SHARED_STRINGS_URI = "devtools/client/locales/shared.properties";
const SHARED_L10N = new LocalizationHelper(SHARED_STRINGS_URI);

class BoxModelInfo extends PureComponent {
  static get propTypes() {
    return {
      boxModel: PropTypes.shape(Types.boxModel).isRequired,
    };
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { boxModel } = this.props;
    const { layout } = boxModel;
    const { height = "-", position, width = "-" } = layout;

    return dom.div(
      { className: "boxmodel-info" },
      dom.span(
        { className: "boxmodel-element-size" },
        SHARED_L10N.getFormatStr("dimensions", width, height)
      ),
      dom.section(
        { className: "boxmodel-position-group" },
        dom.span({ className: "boxmodel-element-position" }, position)
      )
    );
  }
}

module.exports = BoxModelInfo;
