/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

const { getGripType, wrapRender } = require("./rep-utils");

/**
 * Renders a Infinity object
 */
InfinityRep.propTypes = {
  object: PropTypes.object.isRequired,
};

function InfinityRep(props) {
  const { object } = props;

  return span({ className: "objectBox objectBox-number" }, object.type);
}

function supportsObject(object, noGrip = false) {
  return object.isPrimitive() && [Infinity, -Infinity].includes(object.primitive());
}

// Exports from this module
module.exports = {
  rep: wrapRender(InfinityRep),
  supportsObject,
};
