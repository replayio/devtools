const React = require("react");
const ReactDOM = require("react-dom");
import Toolbox from "./Toolbox";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { connect } from "react-redux";
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

  renderTooltip(tooltip) {
    if (!tooltip) {
      return null;
    }

    return (
      <div className="timeline-tooltip" style={{ left: tooltip.left }}>
        {tooltip.screen && (
          <img
            className="timeline-tooltip-image"
            src={`data:${tooltip.screen.mimeType};base64,${tooltip.screen.data}`}
          />
        )}
      </div>
    );
  }

  renderGraphics() {
    const { tooltip } = this.props;
    return (
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="viewer-text"></div>
        <div id="highlighter-root"></div>
        {this.renderTooltip(tooltip)}
      </div>
    );
  }

  render() {
    const { initialize } = this.props;
    const { orientation } = this.state;

    const toolbox = <Toolbox initialize={initialize} />;

    let startPanel, endPanel;
    if (orientation == "bottom" || orientation == "right") {
      startPanel = this.renderGraphics();
      endPanel = toolbox;
    } else {
      startPanel = toolbox;
      endPanel = this.renderGraphics();
    }

    const vert = orientation != "bottom";

    return (
      <>
        <div id="header">
          <div className="logo"></div>
          <div id="status"></div>
        </div>

        <SplitBox
          style={{ width: "100vw", overflow: "hidden" }}
          splitterSize={1}
          initialSize="50%"
          minSize="20%"
          maxSize="80%"
          vert={vert}
          onResizeEnd={num => {}}
          startPanel={startPanel}
          endPanelControl={false}
          endPanel={endPanel}
        />
      </>
    );
  }
}

export default connect(
  state => ({
    theme: selectors.getTheme(state),
    tooltip: selectors.getTooltip(state),
  }),
  {
    updateTheme: actions.updateTheme,
  }
)(App);
