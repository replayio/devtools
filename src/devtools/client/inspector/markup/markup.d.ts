import { ReactElement } from "react";
import { Inspector } from "../inspector";

declare class MarkupView {
  constructor(inspector: Inspector);
  provider: ReactElement;
}
export = MarkupView;
