import { ReactElement } from "react";
import { UIStore } from "ui/actions";
const CSSProperties = require("third-party/css/css-properties");
import { Inspector } from "../inspector";

declare class RulesView {
  constructor(inspector: Inspector, window: Window);
  provider: ReactElement;
  cssProperties: typeof CSSProperties;
  inspector: Inspector;
  store: UIStore;
  outputParser: any;
  readonly dummyElement: HTMLDivElement;
  getRulesProps(): any;
}
export = RulesView;
