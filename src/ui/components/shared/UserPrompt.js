import React from "react";
import "./UserPrompt.css";
import classnames from "classnames";

export default function UserPrompt({ classnames: classArray, children }) {
  return (
    <div className={classnames("user-prompt-container", classArray)}>
      <div className="user-prompt">{children}</div>
    </div>
  );
}
