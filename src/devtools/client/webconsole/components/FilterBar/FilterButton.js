/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const actions = require("devtools/client/webconsole/actions/index");

FilterButton.displayName = "FilterButton";

FilterButton.propTypes = {
  label: PropTypes.string.isRequired,
  filterKey: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

function FilterButton(props) {
  const { active, label, filterKey, onClick, title } = props;

  return dom.button(
    {
      "aria-pressed": active === true,
      className: "devtools-togglebutton",
      "data-category": filterKey,
      title,
      onClick,
    },
    label
  );
}

module.exports = FilterButton;
