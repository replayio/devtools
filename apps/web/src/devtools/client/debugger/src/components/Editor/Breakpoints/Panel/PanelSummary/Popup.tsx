import React from "react";
import ReactPopup from "reactjs-popup";

interface PopupProps {
  trigger?: JSX.Element | ((isOpen: boolean) => JSX.Element);
  children: React.ReactNode;
}

export default function Popup({ trigger, children }: PopupProps) {
  return (
    <ReactPopup
      trigger={<>{trigger}</>}
      on="hover"
      position="right center"
      mouseEnterDelay={200}
      mouseLeaveDelay={200}
    >
      {children}
    </ReactPopup>
  );
}
