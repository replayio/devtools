import React from "react";
import classnames from "classnames";
import "./Prompt.css";

export default function Prompt({ children }) {
  return (
    <div className="prompt-container">
      <div className="prompt-content">{children}</div>
    </div>
  );
}
