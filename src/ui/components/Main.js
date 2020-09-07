const React = require("react");
const ReactDOM = require("react-dom");
import { connect } from "react-redux";
import { withAuth0 } from "@auth0/auth0-react";

import Toolbox from "./Toolbox";
import Tooltip from "./Tooltip";
import Comments from "./Comments";

import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import RightSidebar from "./RightSidebar";
import { actions } from "../actions";
import { selectors } from "../reducers";

import "styles.css";

function setTheme(theme) {
  document.body.parentElement.className = theme;
}

class Main extends React.Component {
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

  render() {
    const { commentVisible, hideComments, updateTimelineDimensions, initialize } = this.props;
    const { orientation } = this.state;
    const { isLoading, isAuthenticated } = this.props.auth0;

    if (isLoading) {
      return <h3>Loading ... </h3>;
    }
    if (!isAuthenticated) {
      return <h3>Please Login</h3>;
    }
    const toolbox = <Toolbox initialize={initialize} />;

    let startPanel, endPanel;
    if (orientation == "bottom" || orientation == "right") {
      startPanel = this.renderViewer(toolbox);
      endPanel = toolbox;
    } else {
      startPanel = toolbox;
      endPanel = this.renderViewer(toolbox);
    }

    const vert = orientation != "bottom";

    return (
      <>
        <Comments />
        {commentVisible && <div className="app-mask" onClick={() => hideComments()} />}
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
      </>
    );
  }
}

export default withAuth0(
  connect(
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
  )(Main)
);
