/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Reps
const { MODE } = require("./constants");
const { getGripType, isGrip, getURLDisplayString, wrapRender } = require("./rep-utils");

/**
 * Renders a grip representing a window.
 */
WindowRep.propTypes = {
  // @TODO Change this to Object.values when supported in Node's version of V8
  mode: PropTypes.oneOf(Object.keys(MODE).map(key => MODE[key])),
  object: PropTypes.object.isRequired,
};

function WindowRep(props) {
  const { mode, object } = props;

  const config = {
    className: "objectBox objectBox-Window",
    "data-link-actor-id": object.id(),
  };

  if (mode === MODE.TINY) {
    return span(config, getTitle(object));
  }

  return span(config, getTitle(object, true), span({ className: "location" }, getLocation(object)));
}

function getTitle(object, trailingSpace) {
  let title = object.className() || "Window";
  if (trailingSpace === true) {
    title = `${title} `;
  }
  return span({ className: "objectTitle" }, title);
}

function getLocation(object) {
  // FIXME
  return undefined;
  //return getURLDisplayString(object.preview.url);
}

// Registration
function supportsObject(object, noGrip = false) {
  return object.className() == "Window";
}

// Exports from this module
module.exports = {
  rep: wrapRender(WindowRep),
  supportsObject,
};
