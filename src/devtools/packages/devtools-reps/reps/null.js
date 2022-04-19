/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies
const { span } = require("react-dom-factories");

const { wrapRender } = require("./rep-utils");

/**
 * Renders null value
 */
function Null(props) {
  return span({ className: "objectBox objectBox-null" }, "null");
}

function supportsObject(object) {
  return object.isPrimitive() && object.primitive() === null;
}

// Exports from this module

module.exports = {
  rep: wrapRender(Null),
  supportsObject,
};
