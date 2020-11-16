export class Toolbox {
  startPanel(panel: string): Promise<any>;
  selectTool(panel: string): Promise<any>;
}

declare global {
  const gToolbox: Toolbox;
}
