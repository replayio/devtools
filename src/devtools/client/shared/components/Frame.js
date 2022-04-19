/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  getSourceNames,
  parseURL,
  getSourceMappedFile,
} = require("devtools/client/shared/source-utils");
const {
  getUnicodeUrl,
  getUnicodeUrlPath,
  getUnicodeHostname,
} = require("devtools/client/shared/unicode-url");
const { MESSAGE_SOURCE } = require("devtools/client/webconsole/constants");
const { LocalizationHelper } = require("devtools/shared/l10n");
const PropTypes = require("prop-types");
const { Component } = require("react");
const dom = require("react-dom-factories");

const l10n = new LocalizationHelper("devtools/client/locales/components.properties");

class Frame extends Component {
  static get propTypes() {
    return {
      // SavedFrame, or an object containing all the required properties.
      frame: PropTypes.shape({
        column: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        functionDisplayName: PropTypes.string,
        line: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        source: PropTypes.string.isRequired,
      }).isRequired,

      // The source of the message
      messageSource: PropTypes.string,

      // Clicking on the frame link -- probably should link to the debugger.
      onClick: PropTypes.func,

      // Option to display a function name even if it's anonymous.
      showAnonymousFunctionName: PropTypes.bool,

      // Option to display a host name if the filename is empty or just '/'
      showEmptyPathAsHost: PropTypes.bool,

      // Option to display a full source instead of just the filename.
      showFullSourceUrl: PropTypes.bool,

      // Option to display a function name before the source link.
      showFunctionName: PropTypes.bool,

      // Option to display a host name after the source link.
      showHost: PropTypes.bool,
    };
  }

  static get defaultProps() {
    return {
      showAnonymousFunctionName: false,
      showEmptyPathAsHost: false,
      showFullSourceUrl: false,
      showFunctionName: false,
      showHost: false,
    };
  }

  constructor(props) {
    super(props);
    this._locationChanged = this._locationChanged.bind(this);
    this.getSourceForClick = this.getSourceForClick.bind(this);
  }

  _locationChanged(isSourceMapped, url, line, column) {
    const newState = {
      isSourceMapped,
    };
    if (isSourceMapped) {
      newState.frame = {
        column,
        functionDisplayName: this.props.frame.functionDisplayName,
        line,
        source: url,
      };
    }

    this.setState(newState);
  }

  /**
   * Utility method to convert the Frame object model to the
   * object model required by the onClick callback.
   * @param Frame frame
   * @returns {{url: *, line: *, column: *, functionDisplayName: *}}
   */
  getSourceForClick(frame) {
    const { source, line, column, sourceId } = frame;
    return {
      column,
      functionDisplayName: this.props.frame.functionDisplayName,
      line,
      sourceId,
      url: source,
    };
  }

  // eslint-disable-next-line complexity
  render() {
    let frame, isSourceMapped;
    const {
      onClick,
      showFunctionName,
      showAnonymousFunctionName,
      showHost,
      showEmptyPathAsHost,
      showFullSourceUrl,
      messageSource,
    } = this.props;

    if (this.state && this.state.isSourceMapped && this.state.frame) {
      frame = this.state.frame;
      isSourceMapped = this.state.isSourceMapped;
    } else {
      frame = this.props.frame;
    }

    const source = frame.source || "";
    const sourceId = frame.sourceId;
    const line = frame.line != void 0 ? Number(frame.line) : null;
    const column = frame.column != void 0 ? Number(frame.column) : null;

    const { short, long, host } = getSourceNames(source);
    const unicodeShort = getUnicodeUrlPath(short);
    const unicodeLong = getUnicodeUrl(long);
    const unicodeHost = host ? getUnicodeHostname(host) : "";

    // Reparse the URL to determine if we should link this; `getSourceNames`
    // has already cached this indirectly. We don't want to attempt to
    // link to "self-hosted" and "(unknown)".
    // Source mapped sources might not necessary linkable, but they
    // are still valid in the debugger.
    // If we have a source ID then we can show the source in the debugger.
    const isLinkable = !!parseURL(source) || isSourceMapped || sourceId;
    const elements = [];
    const sourceElements = [];
    let sourceEl;
    let tooltip = unicodeLong;

    // Exclude all falsy values, including `0`, as line numbers start with 1.
    if (line) {
      tooltip += `:${line}`;
      // Intentionally exclude 0
      if (column) {
        tooltip += `:${column}`;
      }
    }

    const attributes = {
      className: "frame-link",
      "data-url": long,
    };

    if (showFunctionName) {
      let functionDisplayName = frame.functionDisplayName;
      if (!functionDisplayName && showAnonymousFunctionName) {
        functionDisplayName = "<anonymous>";
      }

      if (functionDisplayName) {
        elements.push(
          dom.span(
            {
              className: "frame-link-function-display-name",
              key: "function-display-name",
            },
            functionDisplayName
          ),
          " "
        );
      }
    }

    let displaySource = showFullSourceUrl ? unicodeLong : unicodeShort;
    if (isSourceMapped) {
      displaySource = getSourceMappedFile(displaySource);
    } else if (showEmptyPathAsHost && (displaySource === "" || displaySource === "/")) {
      displaySource = host;
    }

    sourceElements.push(
      dom.span(
        {
          className: "frame-link-filename",
          key: "filename",
        },
        displaySource
      )
    );

    // If we have a line number > 0.
    if (line) {
      let lineInfo = `:${line}`;
      attributes["data-line"] = line;

      sourceElements.push(
        dom.span(
          {
            className: "frame-link-line",
            key: "line",
          },
          lineInfo
        )
      );
    }

    // Inner el is useful for achieving ellipsis on the left and correct LTR/RTL
    // ordering. See CSS styles for frame-link-source-[inner] and bug 1290056.
    let tooltipMessage;
    if (messageSource && messageSource === MESSAGE_SOURCE.CSS) {
      tooltipMessage = l10n.getFormatStr("frame.viewsourceinstyleeditor", tooltip);
    } else {
      tooltipMessage = l10n.getFormatStr("frame.viewsourceindebugger", tooltip);
    }

    const sourceInnerEl = dom.span(
      {
        className: "frame-link-source-inner",
        key: "source-inner",
        title: isLinkable ? tooltipMessage : tooltip,
      },
      sourceElements
    );

    // If source is not a URL (self-hosted, eval, etc.), don't make
    // it an anchor link, as we can't link to it.
    if (isLinkable) {
      sourceEl = dom.a(
        {
          className: "frame-link-source",
          draggable: false,
          href: source,
          onClick: e => {
            e.preventDefault();
            e.stopPropagation();
            onClick(this.getSourceForClick({ ...frame, source, sourceId }));
          },
        },
        sourceInnerEl
      );
    } else {
      sourceEl = dom.span(
        {
          className: "frame-link-source",
          key: "source",
        },
        sourceInnerEl
      );
    }
    elements.push(sourceEl);

    if (showHost && unicodeHost) {
      elements.push(" ");
      elements.push(
        dom.span(
          {
            className: "frame-link-host",
            key: "host",
          },
          unicodeHost
        )
      );
    }

    return dom.span(attributes, ...elements);
  }
}

module.exports = Frame;
