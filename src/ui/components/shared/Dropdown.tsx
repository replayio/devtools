import { motion } from "framer-motion";
import React, { ReactNode } from "react";

export interface DropdownProps {
  buttonContent: ReactNode;
  children: ReactNode;
  dataTestId?: string;
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
  dataTestId,
  setExpanded,
  expanded,
  position = "bottom-left",
  buttonStyle = "primary",
  orientation = "bottom",
}: DropdownProps) {
  return (
    <div className="dropdown-wrapper">
      <button
        className={`expand-dropdown ${buttonStyle}`}
        onClick={() => setExpanded(true)}
        data-dropdown-state={expanded ? "open" : "closed"}
        data-test-id={`${dataTestId}-DropdownButton`}
      >
        {buttonContent}
      </button>
      {expanded ? (
        <div className="dropdown-container" data-test-id={`${dataTestId}-Dropdown`}>
          <div className="mask" onClick={() => setExpanded(false)} />
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.05, 1] }}
            transition={{ duration: 0.17, ease: "easeInOut" }}
            className={`content ${position}`}
            style={orientations[orientation]}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
