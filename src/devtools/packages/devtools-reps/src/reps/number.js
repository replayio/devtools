/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

const { getGripType, wrapRender } = require("./rep-utils");

/**
 * Renders a number
 */
Number.propTypes = {
  object: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.bool]).isRequired,
};

function Number(props) {
  const value = props.object;

  return span({ className: "objectBox objectBox-number" }, stringify(value));
}

function stringify(object) {
  const v = object.primitive();
  return Object.is(v, -0) ? "-0" : String(v);
}

function supportsObject(object) {
  return object.isPrimitive() && ["number", "boolean"].includes(typeof object.primitive());
}

// Exports from this module

module.exports = {
  rep: wrapRender(Number),
  supportsObject,
};
