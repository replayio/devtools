import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App version="v18.2.0" useState={useState} useEffect={useEffect} />
);
