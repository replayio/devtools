import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

async function initRemotes() {
  // @ts-ignore
  const react15Export = await import(/* @vite-ignore */ "react15/appInjector");
  // @ts-ignore
  const react16Export = await import(/* @vite-ignore */ "react16/appInjector");
  // @ts-ignore
  const react17Export = await import(/* @vite-ignore */ "react17/appInjector");

  react15Export.default.inject("root-15");
  react16Export.default.inject("root-16");
  react17Export.default.inject("root-17");

  ReactDOM.createRoot(document.getElementById("root-18")!).render(<App />);
}

initRemotes();
