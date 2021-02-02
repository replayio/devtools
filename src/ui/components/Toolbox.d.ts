export class Toolbox {
  getPanel(panel: string): any;
  startPanel(panel: string): Promise<any>;
  selectTool(panel: string): Promise<any>;
  timeline: unknown;
}

declare global {
  const gToolbox: Toolbox;
}
