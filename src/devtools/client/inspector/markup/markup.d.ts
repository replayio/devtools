import { ReactElement } from "react";
import { Inspector } from "../inspector";
import { MarkupProps } from "./components/MarkupApp";

declare class MarkupView {
  constructor(inspector: Inspector);
  provider: ReactElement;
  getMarkupProps(): MarkupProps;
}
export = MarkupView;
