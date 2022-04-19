/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { span } = require("react-dom-factories");

// Reps
const { getGripType, isGrip, getURLDisplayString, wrapRender } = require("./rep-utils");

/**
 * Renders a grip representing CSSStyleSheet
 */
StyleSheet.propTypes = {
  object: PropTypes.object.isRequired,
};

function StyleSheet(props) {
  const grip = props.object;

  return span(
    {
      className: "objectBox objectBox-object",
      "data-link-actor-id": grip.actor,
    },
    getTitle(grip),
    span({ className: "objectPropValue" }, getLocation(grip))
  );
}

function getTitle(grip) {
  const title = "StyleSheet ";
  return span({ className: "objectBoxTitle" }, title);
}

function getLocation(grip) {
  // Embedded stylesheets don't have URL and so, no preview.
  const url = grip.preview ? grip.preview.url : "";
  return url ? getURLDisplayString(url) : "";
}

// Registration
function supportsObject(object) {
  return object.className() == "CSSStyleSheet";
}

// Exports from this module

module.exports = {
  rep: wrapRender(StyleSheet),
  supportsObject,
};
