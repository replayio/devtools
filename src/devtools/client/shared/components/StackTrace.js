/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const Frame = require("devtools/client/shared/components/Frame");

class AsyncFrameClass extends React.Component {
  static get propTypes() {
    return {
      asyncCause: PropTypes.string.isRequired,
    };
  }

  render() {
    const { asyncCause } = this.props;

    return dom.span({ className: "frame-link-async-cause" }, `(Async: ${asyncCause})`);
  }
}

class StackTrace extends React.Component {
  static get propTypes() {
    return {
      stacktrace: PropTypes.array.isRequired,
      onViewSourceInDebugger: PropTypes.func.isRequired,
    };
  }

  render() {
    const { stacktrace, onViewSourceInDebugger } = this.props;

    if (!stacktrace) {
      return null;
    }

    const frames = [];
    stacktrace.forEach((s, i) => {
      if (s.asyncCause) {
        frames.push(
          "\t",
          React.createElement(AsyncFrameClass, {
            key: `${i}-asyncframe`,
            asyncCause: s.asyncCause,
          }),
          "\n"
        );
      }

      const source = s.filename;
      frames.push(
        "\t",
        React.createElement(Frame, {
          key: `${i}-frame`,
          frame: {
            functionDisplayName: s.functionName,
            source,
            line: s.lineNumber,
            column: s.columnNumber,
          },
          showFunctionName: true,
          showAnonymousFunctionName: true,
          showFullSourceUrl: true,
          onClick: onViewSourceInDebugger,
        }),
        "\n"
      );
    });

    return dom.div({ className: "stack-trace" }, frames);
  }
}

module.exports = StackTrace;
