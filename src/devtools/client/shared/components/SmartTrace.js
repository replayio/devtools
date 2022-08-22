/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const PropTypes = require("prop-types");
const { connect } = require("react-redux");
const { getSourceDetailsEntities, getSourceIdsByUrl } = require("ui/reducers/sources");
const { getPreferredLocation } = require("ui/utils/preferredLocation");

const Frames =
  require("devtools/client/debugger/src/components/SecondaryPanes/Frames/index").Frames;
const {
  annotateFrames,
} = require("devtools/client/debugger/src/utils/pause/frames/annotateFrames");

const { ThreadFront } = require("protocol/thread");

class SmartTrace extends React.Component {
  static get propTypes() {
    return {
      stacktrace: PropTypes.array.isRequired,
      onViewSourceInDebugger: PropTypes.func.isRequired,
      // Function that will be called when the SmartTrace is ready, i.e. once it was
      // rendered.
      onReady: PropTypes.func,
      mapSources: PropTypes.bool,
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
  UNSAFE_componentWillMount() {
    if (!this.props.mapSources) {
      return;
    }

    const mappedStack = this.props.stacktrace.map(async frame => {
      const { lineNumber, columnNumber, filename } = frame;
      let sourceIds = this.props.sourceIdsByUrl?.[filename] || [];
      // Ignore IDs which are original versions of another ID with the same URL.
      sourceIds = sourceIds.filter(sourceId => {
        const generatedIds = this.props.sourcesById[sourceId]?.generated;
        return (generatedIds || []).every(generatedId => !sourceIds.includes(generatedId));
      });
      if (sourceIds.length != 1) {
        return frame;
      }
      const location = {
        sourceId: sourceIds[0],
        line: lineNumber,
        column: columnNumber,
      };
      const mapped = getPreferredLocation(
        await ThreadFront.mappedLocations.getMappedLocation(location)
      );
      return {
        ...frame,
        lineNumber: mapped.line,
        columnNumber: mapped.column,
        filename: this.props.sourcesById[mapped.sourceId]?.url,
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
    console.error("Error while rendering stacktrace:", error, info, "props:", this.props);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    const { onViewSourceInDebugger, onViewSource, mapSources } = this.props;

    const stacktrace = this.state.isSourceMapped ? this.state.stacktrace : this.props.stacktrace;

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

    return React.createElement(Frames, {
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
        return `View source in Debugger → ${url}`;
      },
      disableFrameTruncate: true,
      disableContextMenu: true,
      frameworkGroupingOn: true,
      displayFullUrl: mapSources && (!this.state || !this.state.isSourceMapped),
      panel: "webconsole",
      showUnloadedRegionError: false,
    });
  }
}

const connector = connect(state => ({
  sourcesById: getSourceDetailsEntities(state),
  sourceIdsByUrl: getSourceIdsByUrl(state),
}));

module.exports = connector(SmartTrace);
