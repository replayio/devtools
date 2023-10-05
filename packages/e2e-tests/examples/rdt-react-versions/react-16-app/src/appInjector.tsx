import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

export const inject = (parentElementId: string) =>
  ReactDOM.render(<App />, document.getElementById(parentElementId)!);

export const unmount = (parentElementId: string) =>
  ReactDOM.unmountComponentAtNode(document.getElementById(parentElementId)!);
