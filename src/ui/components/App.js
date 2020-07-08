/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const React = require("react");
const ReactDOM = require("react-dom");
import Toolbox from "./Toolbox";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

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
