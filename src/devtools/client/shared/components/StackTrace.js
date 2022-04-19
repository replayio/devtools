/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Frame = require("devtools/client/shared/components/Frame");
const { LocalizationHelper } = require("devtools/shared/l10n");
const PropTypes = require("prop-types");
const React = require("react");
const dom = require("react-dom-factories");

const l10n = new LocalizationHelper("devtools/client/locales/webconsole.properties");

class AsyncFrameClass extends React.Component {
  static get propTypes() {
    return {
      asyncCause: PropTypes.string.isRequired,
    };
  }

  render() {
    const { asyncCause } = this.props;

    return dom.span(
      { className: "frame-link-async-cause" },
      l10n.getFormatStr("stacktrace.asyncStack", asyncCause)
    );
  }
}

class StackTrace extends React.Component {
  static get propTypes() {
    return {
      onViewSourceInDebugger: PropTypes.func.isRequired,
      stacktrace: PropTypes.array.isRequired,
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
            asyncCause: s.asyncCause,
            key: `${i}-asyncframe`,
          }),
          "\n"
        );
      }

      const source = s.filename;
      frames.push(
        "\t",
        React.createElement(Frame, {
          frame: {
            column: s.columnNumber,
            functionDisplayName: s.functionName,
            line: s.lineNumber,
            source,
          },
          key: `${i}-frame`,
          onClick: onViewSourceInDebugger,
          showAnonymousFunctionName: true,
          showFullSourceUrl: true,
          showFunctionName: true,
        }),
        "\n"
      );
    });

    return dom.div({ className: "stack-trace" }, frames);
  }
}

module.exports = StackTrace;
