const { ComputedViewTool } = require("devtools/client/inspector/computed/computed");
const InspectorTabPanel = require("devtools/client/inspector/components/InspectorTabPanel");

import { createElement, ReactElement } from "react";

export class ComputedPanel {
  private tool: any;
  provider?: ReactElement;

  constructor(inspector: any) {
    this.tool = new ComputedViewTool(inspector, window);
    this.provider = createElement(InspectorTabPanel, { id: "sidebar-panel-computedview" });
  }

  destroy() {
    this.tool.destroy();
    this.tool = undefined;
    this.provider = undefined;
  }
}
