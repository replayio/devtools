export class Toolbox {
  getPanel(panel: string): any;
  startPanel(panel: string): Promise<any>;
  selectTool(panel: string): Promise<any>;
}

declare global {
  const gToolbox: Toolbox;
}
