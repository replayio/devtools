const { ComputedViewTool } = require("devtools/client/inspector/computed/computed");
// const InspectorTabPanel = require("devtools/client/inspector/components/InspectorTabPanel");
import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
import { createElement, ReactElement } from "react";
import { Inspector } from "../inspector";

export class ComputedPanel {
  private tool: any;
  provider?: ReactElement;

  constructor(inspector: Inspector) {
    this.tool = new ComputedViewTool(inspector, window);
    // this.provider = createElement(InspectorTabPanel, { id: "sidebar-panel-computedview" });
    this.provider = createElement(ComputedApp);
  }

  get computedView() {
    return this.tool.computedView;
  }

  destroy() {
    this.tool.destroy();
    this.tool = undefined;
    this.provider = undefined;
  }
}
