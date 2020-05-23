


const { Component } = require("react");
const ReactDOM = require("react-dom");
const { DebuggerPanel } = require("devtools/client/debugger/panel");
const { WebConsolePanel } = require("devtools/client/webconsole/panel");
const WebReplayPlayer = require("./WebReplayPlayer");
const { ThreadFront } = require("protocol/thread");

export default class Toolbox {
    currentTool = null
    _panels = {}
    sourceMapService = {
        getOriginalLocations: (locations) => locations,
        getOriginalLocation: (location) => location,
    }

    parserService = {
        hasSyntaxError: (text) => false,
    }

    componentDidMount() {
        const debuggerPanel = new DebuggerPanel(this);
        this.addTool("jsdebugger", debuggerPanel);

        const consolePanel = new WebConsolePanel(this);
        this.addTool("webconsole", consolePanel);

        // const timeline = React.createElement(WebReplayPlayer, { toolbox: this });
        // ReactDOM.render(timeline, document.getElementById("toolbox-timeline"));

        debuggerPanel.open();
        consolePanel.open();

        this.selectTool("jsdebugger");
    }

    getPanel(name) {
        return this._panels[name];
    }

    async getPanelWhenReady(name) {
        const panel = this.getPanel(name);
        await panel.readyWaiter.promise;
        return panel;
    }

    threadFront = ThreadFront

    on() { }

    getHighlighter() {
        return {};
    }

    addTool(name, panel) {
        this._panels[name] = panel;
        const button = document.getElementById(`toolbox-toolbar-${name}`);
        button.addEventListener("click", () => this.selectTool(name));
    }

    loadTool(name) {
        return this.getPanelWhenReady(name);
    }

    selectTool(name) {
        if (name == this.currentTool) {
            return;
        }
        this.currentTool = name;
        const toolbox = document.getElementById(`toolbox`);
        toolbox.classList = name;
    }


    // Helpers for debugging.
    webconsoleState() {
        return this.webconsoleHud.ui.wrapper.getStore().getState();
    }

    render() {
        return <>
            <div id="toolbox-timeline">
                <WebReplayPlayer toolbox={this} />
            </div>
            <div id="toolbox-toolbar">
                <div class="toolbar-panel-button" id="toolbox-toolbar-jsdebugger">
                    <div class="toolbar-panel-icon"></div>
        Debugger
      </div>
                <div class="toolbar-panel-button" id="toolbox-toolbar-webconsole">
                    <div class="toolbar-panel-icon"></div>
        Console
      </div>
            </div>
            <div id="toolbox-contents">
                <div class="toolbar-panel-content" id="toolbox-content-jsdebugger"></div>
                <div class="toolbar-panel-content" id="toolbox-content-webconsole"></div>
            </div>

        </>
    }
}