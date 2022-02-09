/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// React
const React = require("react");
const PropTypes = require("prop-types");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const ObjectInspector =
  require("devtools/client/webconsole/utils/connected-object-inspector").default;

const reps = require("devtools/packages/devtools-reps");
const { MODE } = reps;

GripMessageBody.displayName = "GripMessageBody";

GripMessageBody.propTypes = {
  grip: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]).isRequired,
  userProvidedStyle: PropTypes.string,
  useQuotes: PropTypes.bool,
  escapeWhitespace: PropTypes.bool,
  type: PropTypes.string,
  maybeScrollToBottom: PropTypes.func,
};

GripMessageBody.defaultProps = {
  mode: MODE.LONG,
};

function GripMessageBody(props) {
  const {
    grip,
    userProvidedStyle,
    useQuotes,
    escapeWhitespace,
    mode = MODE.LONG,
    dispatch,
    maybeScrollToBottom,
  } = props;

  let styleObject;
  if (userProvidedStyle && userProvidedStyle !== "") {
    styleObject = cleanupStyle(userProvidedStyle, nodename => document.createElement(nodename));
  }

  const objectInspectorProps = {
    autoExpandDepth: shouldAutoExpandObjectInspector(props) ? 1 : 0,
    mode,
    maybeScrollToBottom,
    dispatch,
  };

  if (grip.isString()) {
    Object.assign(objectInspectorProps, {
      useQuotes,
      transformEmptyString: true,
      escapeWhitespace,
      style: styleObject,
    });
  }

  return <ObjectInspector value={grip} {...objectInspectorProps} />;
}

// Regular expression that matches the allowed CSS property names.
const allowedStylesRegex = new RegExp(
  "^(?:-moz-)?(?:background|border|box|clear|color|cursor|display|float|font|line|" +
    "margin|padding|text|transition|outline|white-space|word|writing|" +
    "(?:min-|max-)?width|(?:min-|max-)?height)"
);

// Regular expression that matches the forbidden CSS property values.
const forbiddenValuesRegexs = [
  // -moz-element()
  /\b((?:-moz-)?element)[\s('"]+/gi,

  // various URL protocols
  /['"(]*(?:chrome|resource|about|app|https?|ftp|file):+\/*/gi,
];

function cleanupStyle(userProvidedStyle, createElement) {
  // Use a dummy element to parse the style string.
  const dummy = createElement("div");
  dummy.style = userProvidedStyle;

  // Return a style object as expected by React DOM components, e.g.
  // {color: "red"}
  // without forbidden properties and values.
  return Array.from(dummy.style)
    .filter(name => {
      return (
        allowedStylesRegex.test(name) &&
        !forbiddenValuesRegexs.some(regex => regex.test(dummy.style[name]))
      );
    })
    .reduce((object, name) => {
      return Object.assign(
        {
          [name]: dummy.style[name],
        },
        object
      );
    }, {});
}

function shouldAutoExpandObjectInspector(props) {
  const { type } = props;

  return type === MESSAGE_TYPE.DIR;
}

module.exports = GripMessageBody;
