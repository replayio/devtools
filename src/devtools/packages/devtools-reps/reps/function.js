/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// ReactJS
const PropTypes = require("prop-types");
const { button, span } = require("react-dom-factories");

// Reps
const { MODE } = require("./constants");
const { getGripType, isGrip, cropString, wrapRender } = require("./rep-utils");

const IGNORED_SOURCE_URLS = ["debugger eval code"];

/**
 * This component represents a template for Function objects.
 */
FunctionRep.propTypes = {
  object: PropTypes.object.isRequired,
  onViewSourceInDebugger: PropTypes.func,
};

function FunctionRep(props) {
  const { object: grip, onViewSourceInDebugger } = props;

  let jumpToDefinitionButton;
  const location = grip.functionLocation();
  const url = grip.functionLocationURL();
  if (onViewSourceInDebugger && url && !IGNORED_SOURCE_URLS.includes(url)) {
    jumpToDefinitionButton = button({
      className: "jump-definition",
      draggable: false,
      onClick: async e => {
        // Stop the event propagation so we don't trigger ObjectInspector
        // expand/collapse.
        e.stopPropagation();
        onViewSourceInDebugger({
          column: location.column,
          line: location.line,
          url,
        });
      },
      title: "Jump to definition",
    });
  }

  const elProps = {
    className: "objectBox objectBox-function",
    "data-link-actor-id": grip.id(),
    // Set dir="ltr" to prevent parentheses from
    // appearing in the wrong direction
    dir: "ltr",
  };

  const parameterNames = (grip.functionParameterNames() || []).filter(param => param);

  /*
  if (grip.isClassConstructor) {
    return span(
      elProps,
      getClassTitle(grip, props),
      getFunctionName(grip, props),
      ...getClassBody(parameterNames, props),
      jumpToDefinitionButton
    );
  }
  */

  return span(
    elProps,
    getFunctionTitle(grip, props),
    getFunctionName(grip, props),
    "(",
    ...getParams(parameterNames),
    ")",
    jumpToDefinitionButton
  );
}

function getClassTitle(grip) {
  return span(
    {
      className: "objectTitle",
    },
    "class "
  );
}

function getFunctionTitle(grip, props) {
  const { mode } = props;

  if (mode === MODE.TINY /* && !grip.isGenerator && !grip.isAsync*/) {
    return null;
  }

  let title = mode === MODE.TINY ? "" : "function ";

  /*
  if (grip.isGenerator) {
    title = mode === MODE.TINY ? "* " : "function* ";
  }

  if (grip.isAsync) {
    title = `${"async" + " "}${title}`;
  }
  */

  return span(
    {
      className: "objectTitle",
    },
    title
  );
}

/**
 * Returns a ReactElement representing the function name.
 *
 * @param {Object} grip : Function grip
 * @param {Object} props: Function rep props
 */
function getFunctionName(grip, props = {}) {
  const name = props.functionName || grip.functionName() || "function";
  return cropString(name, 100);
}

const objectProperty = /([\w\d\$]+)$/;
const arrayProperty = /\[(.*?)\]$/;
const functionProperty = /([\w\d]+)[\/\.<]*?$/;
const annonymousProperty = /([\w\d]+)\(\^\)$/;

/**
 * Decodes an anonymous naming scheme that
 * spider monkey implements based on "Naming Anonymous JavaScript Functions"
 * http://johnjbarton.github.io/nonymous/index.html
 *
 * @param {String} name : Function name to clean up
 * @returns String
 */
function cleanFunctionName(name) {
  for (const reg of [objectProperty, arrayProperty, functionProperty, annonymousProperty]) {
    const match = reg.exec(name);
    if (match) {
      return match[1];
    }
  }

  return name;
}

function getClassBody(constructorParams, props) {
  const { mode } = props;

  if (mode === MODE.TINY) {
    return [];
  }

  return [" {", ...getClassConstructor(constructorParams), "}"];
}

function getClassConstructor(parameterNames) {
  if (parameterNames.length === 0) {
    return [];
  }

  return [" constructor(", ...getParams(parameterNames), ") "];
}

function getParams(parameterNames) {
  return parameterNames.flatMap((param, index, arr) => {
    return [
      span({ className: "param" }, param),
      index === arr.length - 1 ? "" : span({ className: "delimiter" }, ", "),
    ];
  });
}

// Registration
function supportsObject(grip, noGrip = false) {
  return grip.hasPreview() && grip.className() == "Function";
}

// Exports from this module

module.exports = {
  cleanFunctionName,
  // exported for testing purpose.
  getFunctionName,

  rep: wrapRender(FunctionRep),

  supportsObject,
};
