import Selection from "devtools/client/framework/selection";

export class Toolbox {
  getPanel(panel: string): any;
  startPanel(panel: string): Promise<any>;
  selectTool(panel: string): Promise<any>;
  init(panel: string): void;
  timeline: unknown;
  selection: Selection;
  nodePicker: any;
}

declare global {
  const gToolbox: Toolbox;
}
