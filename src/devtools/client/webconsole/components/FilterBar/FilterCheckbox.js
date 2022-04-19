/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const PropTypes = require("prop-types");
const dom = require("react-dom-factories");

FilterCheckbox.displayName = "FilterCheckbox";

FilterCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string,
};

function FilterCheckbox(props) {
  const { checked, label, title, onChange } = props;
  return dom.label(
    { className: "filter-checkbox", title },
    dom.input({
      checked,
      onChange,
      type: "checkbox",
    }),
    label
  );
}

module.exports = FilterCheckbox;
