/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Reps
const { getGripType, isGrip, getURLDisplayString, wrapRender } = require("./rep-utils");

/**
 * Renders DOM document object.
 */
Document.propTypes = {
  object: PropTypes.object.isRequired,
};

function Document(props) {
  const grip = props.object;
  const location = getLocation(grip);
  return span(
    {
      className: "objectBox objectBox-document",
      "data-link-actor-id": grip.id(),
    },
    getTitle(grip),
    location ? span({ className: "location" }, ` ${location}`) : null
  );
}

function getLocation(grip) {
  const location = grip.documentURL();
  return location ? getURLDisplayString(location) : null;
}

function getTitle(grip) {
  return span(
    {
      className: "objectTitle",
    },
    grip.className()
  );
}

// Registration
function supportsObject(object, noGrip = false) {
  return object.className() === "HTMLDocument";
}

// Exports from this module
module.exports = {
  rep: wrapRender(Document),
  supportsObject,
};
