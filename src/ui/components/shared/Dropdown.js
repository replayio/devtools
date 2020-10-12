import React from "react";
import classnames from "classnames";
import "./Dropdown.css";

function Dropdown({ buttonContent, children, setExpanded, expanded, position = "bottom-left" }) {
  return (
    <div className="dropdown-wrapper">
      <button className="expand-dropdown" onClick={() => setExpanded(true)}>
        {buttonContent}
      </button>
      {expanded ? (
        <div className="dropdown-container">
          <div className="mask" onClick={() => setExpanded(false)} />
          <div className={`content ${position}`}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export default Dropdown;
