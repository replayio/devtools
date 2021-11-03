import React, { ReactNode } from "react";

export interface DropdownProps {
  buttonContent: ReactNode;
  children: ReactNode;
  setExpanded: (expanded: boolean) => void;
  expanded: boolean;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  buttonStyle?: string;
  orientation?: "bottom" | "right" | void;
}

const orientations = {
  bottom: { bottom: "auto", left: "auto", right: "10px", top: "auto" },
  right: { bottom: "10px", left: "50px", right: "auto", top: "auto" },
};

export default function Dropdown({
  buttonContent,
  children,
  setExpanded,
  expanded,
  position = "bottom-left",
  buttonStyle = "primary",
  orientation = "bottom",
}: DropdownProps) {
  return (
    <div className="dropdown-wrapper">
      <button className={`expand-dropdown ${buttonStyle}`} onClick={() => setExpanded(true)}>
        {buttonContent}
      </button>
      {expanded ? (
        <div className="dropdown-container">
          <div className="mask" onClick={() => setExpanded(false)} />
          <div className={`content ${position}`} style={orientations[orientation]}>
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
