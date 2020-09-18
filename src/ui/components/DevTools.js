const React = require("react");
import { connect } from "react-redux";

import Toolbox from "./Toolbox";
import Comments from "./Comments";
import Recordings from "./Recordings/index";
import Tooltip from "./Tooltip";
import Header from "./Header";

import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import RightSidebar from "./RightSidebar";
import { actions } from "../actions";
import { selectors } from "../reducers";

class DevTools extends React.Component {
  state = {
    orientation: "bottom",
  };

  renderViewer(toolbox) {
    const { tooltip } = this.props;
    return (
      <div id="outer-viewer">
        <div id="viewer">
          <canvas id="graphics"></canvas>
          <div id="highlighter-root"></div>
        </div>
        <RightSidebar toolbox={toolbox} />
        <Tooltip tooltip={tooltip} />
      </div>
    );
  }

  renderSplitBox() {
    const { updateTimelineDimensions } = this.props;
    const { orientation } = this.state;

    let startPanel, endPanel;
    const vert = orientation != "bottom";
    const toolbox = <Toolbox />;

    if (orientation == "bottom" || orientation == "right") {
      startPanel = this.renderViewer(toolbox);
      endPanel = toolbox;
    } else {
      startPanel = toolbox;
      endPanel = this.renderViewer(toolbox);
    }

    return (
      <SplitBox
        style={{ width: "100vw", overflow: "hidden" }}
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
    );
  }

  render() {
    const { hideComments, loading, commentVisible } = this.props;
    const recordingIsLoading = loading < 100;

    if (recordingIsLoading) {
      return (
        <>
          <Header />
          <div className="loading-bar" style={{ width: `${loading}%` }} />
        </>
      );
    }

    return (
      <>
        <Header />
        <Comments />
        {commentVisible && <div className="app-mask" onClick={() => hideComments()} />}
        {this.renderSplitBox()}
      </>
    );
  }
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    user: selectors.getUser(state),
    tooltip: selectors.getTooltip(state),
    commentVisible: selectors.commentVisible(state),
  }),
  {
    hideComments: actions.hideComments,
    updateTimelineDimensions: actions.updateTimelineDimensions,
  }
)(DevTools);
