import React, { CSSProperties, ReactNode } from "react";
import "./Dropdown.css";

export interface DropdownProps {
  buttonContent: string;
  children: ReactNode;
  setExpanded: (expanded: boolean) => void;
  expanded: boolean;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  buttonStyle?: string;
  style?: CSSProperties;
}

export default function Dropdown({
  buttonContent,
  children,
  setExpanded,
  expanded,
  position = "bottom-left",
  buttonStyle = "primary",
  style,
}: DropdownProps) {
  return (
    <div className="dropdown-wrapper">
      <button className={`expand-dropdown ${buttonStyle}`} onClick={() => setExpanded(true)}>
        {buttonContent}
      </button>
      {expanded ? (
        <div className="dropdown-container">
          <div className="mask" onClick={() => setExpanded(false)} />
          <div className={`content ${position}`} style={style}>
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
