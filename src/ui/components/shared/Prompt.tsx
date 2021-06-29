import React from "react";
import "./Prompt.css";

export default function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="prompt-container">
      <div className="prompt-content">{children}</div>
    </div>
  );
}
