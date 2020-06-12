/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {
  Component,
  createFactory,
} = require("react");
const PropTypes = require("prop-types");
const { LocalizationHelper } = require("devtools/shared/l10n");

const l10n = new LocalizationHelper(
  "devtools/client/locales/components.properties"
);
const dbgL10n = new LocalizationHelper(
  "devtools/client/locales/debugger.properties"
);
const Frames = createFactory(
  require("devtools/client/debugger/src/components/SecondaryPanes/Frames/index")
    .Frames
);
const {
  annotateFrames,
} = require("devtools/client/debugger/src/utils/pause/frames/annotateFrames");

const { ThreadFront } = require("protocol/thread");

class SmartTrace extends Component {
  static get propTypes() {
    return {
      stacktrace: PropTypes.array.isRequired,
      onViewSource: PropTypes.func.isRequired,
      onViewSourceInDebugger: PropTypes.func.isRequired,
      // Function that will be called when the SmartTrace is ready, i.e. once it was
      // rendered.
      onReady: PropTypes.func,
    };
  }

  static get defaultProps() {
    return {};
  }

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      frozen: false,
    };
  }

  getChildContext() {
    return { l10n: dbgL10n };
  }

  componentWillMount() {
    const mappedStack = this.props.stacktrace.map(async frame => {
      const { lineNumber, columnNumber, filename } = frame;
      const scriptIds = ThreadFront.getScriptIdsForURL(filename);
      if (scriptIds.length != 1) {
        return frame;
      }
      const location = {
        scriptId: scriptIds[0],
        line: lineNumber,
        column: columnNumber,
      };
      const mapped = await ThreadFront.getPreferredMappedLocation(location);
      return {
        ...frame,
        lineNumber: mapped.line,
        columnNumber: mapped.column,
        filename: ThreadFront.getScriptURL(mapped.scriptId),
      };
    });

    Promise.all(mappedStack).then(stacktrace => {
      this.setState({
        isSourceMapped: true,
        frozen: true,
        stacktrace,
      });
    });
  }

  componentDidMount() {
    if (this.props.onReady) {
      this.props.onReady();
    }
  }

  componentDidCatch(error, info) {
    console.error(
      "Error while rendering stacktrace:",
      error,
      info,
      "props:",
      this.props
    );
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    const { onViewSourceInDebugger, onViewSource } = this.props;

    const stacktrace = this.state.isSourceMapped
      ? this.state.stacktrace
      : this.props.stacktrace;

    const frames = annotateFrames(
      stacktrace.map((f, i) => ({
        ...f,
        id: "fake-frame-id-" + i,
        location: {
          ...f,
          line: f.lineNumber,
          column: f.columnNumber,
        },
        displayName: f.functionName,
        source: {
          url: f.filename && f.filename.split(" -> ").pop(),
        },
      }))
    );

    return Frames({
      frames,
      selectFrame: (cx, { location }) => {
        const viewSource = onViewSourceInDebugger || onViewSource;

        viewSource({
          sourceId: location.sourceId,
          url: location.filename,
          line: location.line,
          column: location.column,
        });
      },
      getFrameTitle: url => {
        return l10n.getFormatStr("frame.viewsourceindebugger", url);
      },
      disableFrameTruncate: true,
      disableContextMenu: true,
      frameworkGroupingOn: true,
      displayFullUrl: !this.state || !this.state.isSourceMapped,
      panel: "webconsole",
    });
  }
}

SmartTrace.childContextTypes = {
  l10n: PropTypes.object,
};

module.exports = SmartTrace;
