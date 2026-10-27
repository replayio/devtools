import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

const roots = new Map<string, ReactDOM.Root>();

export const inject = (parentElementId: string) => {
  const root = ReactDOM.createRoot(document.getElementById(parentElementId)!);
  roots.set(parentElementId, root);
  root.render(<App />);
};

export const unmount = (parentElementId: string) => {
  roots.get(parentElementId)?.unmount();
  roots.delete(parentElementId);
};
