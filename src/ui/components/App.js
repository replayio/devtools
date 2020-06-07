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

export default class App extends React.Component {
  state = {
    orientation: "bottom",
  };

  componentDidMount() {
    // for testing `app.setState({orientation: "left"})`
    window.app = this;
  }

  render() {
    const { initialize } = this.props;
    const { orientation } = this.state;

    const graphics = (
      <>
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </>
    );
    const toolbox = <Toolbox initialize={initialize} />;

    let startPanel, endPanel;
    if (orientation == "bottom" || orientation == "right") {
      startPanel = graphics;
      endPanel = toolbox;
    } else {
      startPanel = toolbox;
      endPanel = graphics;
    }

    const vert = orientation != "bottom";

    return (
      <>
        <div id="header">
          <div className="logo"></div>
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
