/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Reps
const { getGripType, isGrip, wrapRender } = require("./rep-utils");

/**
 * Renders a grip object with regular expression.
 */
RegExp.propTypes = {
  object: PropTypes.object.isRequired,
};

function RegExp(props) {
  const { object } = props;

  return span(
    {
      className: "objectBox objectBox-regexp regexpSource",
      "data-link-actor-id": object.id(),
    },
    getSource(object)
  );
}

function getSource(grip) {
  return grip.regexpString();
}

// Registration
function supportsObject(object) {
  return object.hasPreview() && object.className() == "RegExp";
}

// Exports from this module
module.exports = {
  rep: wrapRender(RegExp),
  supportsObject,
};
