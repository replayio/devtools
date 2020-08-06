const React = require("react");
const ReactDOM = require("react-dom");
import { connect } from "react-redux";

import Toolbox from "./Toolbox";
import Tooltip from "./Tooltip";
import Comments from "./Comments";

import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import EventsTimeline from "./EventsTimeline";
import { actions } from "../actions";
import { selectors } from "../reducers";

import "styles.css";

function setTheme(theme) {
  document.body.parentElement.className = theme;
}

class App extends React.Component {
  state = {
    orientation: "bottom",
    tooltip: null,
  };

  componentDidMount() {
    const { theme } = this.props;
    setTheme(theme);
  }

  componentDidUpdate(prevProps) {
    const { theme } = this.props;
    if (theme !== prevProps.theme) {
      setTheme(theme);
    }
  }

  // renderTooltip(tooltip) {
  //   if (!tooltip) {
  //     return null;
  //   }

  //   return (
  //     <div className="timeline-tooltip" style={{ left: tooltip.left }}>
  //       {tooltip.screen && (
  //         <img
  //           className="timeline-tooltip-image"
  //           src={`data:${tooltip.screen.mimeType};base64,${tooltip.screen.data}`}
  //         />
  //       )}
  //     </div>
  //   );
  // }

  renderViewer() {
    const { tooltip } = this.props;
    return (
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <EventsTimeline />
        <div id="highlighter-root"></div>
        <Tooltip tooltip={tooltip} />
      </div>
    );
  }

  render() {
    const { initialize, commentVisible, hideComments, updateTimelineDimensions } = this.props;
    const { orientation } = this.state;

    const toolbox = <Toolbox initialize={initialize} />;

    let startPanel, endPanel;
    if (orientation == "bottom" || orientation == "right") {
      startPanel = this.renderViewer();
      endPanel = toolbox;
    } else {
      startPanel = toolbox;
      endPanel = this.renderViewer();
    }

    const vert = orientation != "bottom";

    return (
      <>
        <div id="header">
          <div className="logo"></div>
          <div id="status"></div>
        </div>
        <Comments />
        {commentVisible && <div className="app-mask" onClick={() => hideComments()} />}
        <div
          className="outer-viewer"
          style={{ display: "flex", height: "100%", flexDirection: "row" }}
        >
          <SplitBox
            style={{ flexGrow: "1", overflow: "hidden" }}
            splitterSize={1}
            initialSize="50%"
            minSize="20%"
            maxSize="80%"
            vert={vert}
            onMove={num => updateTimelineDimensions()}
            startPanel={startPanel}
            endPanelControl={false}
            endPanel={endPanel}
          />
        </div>
      </>
    );
  }
}

export default connect(
  state => ({
    theme: selectors.getTheme(state),
    tooltip: selectors.getTooltip(state),
    commentVisible: selectors.commentVisible(state),
  }),
  {
    updateTheme: actions.updateTheme,
    hideComments: actions.hideComments,
    updateTimelineDimensions: actions.updateTimelineDimensions,
  }
)(App);
