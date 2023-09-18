import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root-18")!).render(<App />);

async function initRemotes() {
  // @ts-ignore
  const react17Export = await import("react17/appInjector");
  const { inject, unmount } = react17Export.default;
  console.log("React 17 export: ", react17Export);
  inject("root-17");
}

initRemotes();
