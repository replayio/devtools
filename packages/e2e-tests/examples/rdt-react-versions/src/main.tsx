import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

async function initRemotes() {
  // @ts-ignore
  const react16Export = await import(/* @vite-ignore */ "react16/appInjector");
  // @ts-ignore
  const react17Export = await import(/* @vite-ignore */ "react17/appInjector");
  // @ts-ignore
  const react19Export = await import(/* @vite-ignore */ "react19/appInjector");

  react16Export.default.inject("root-16");
  react17Export.default.inject("root-17");

  ReactDOM.createRoot(document.getElementById("root-18")!).render(<App />);
  react19Export.default.inject("root-19");
}

initRemotes();
