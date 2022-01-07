import React, { Component } from "react";

interface DropdownProps {
  panel: React.ReactNode;
  icon: React.ReactNode;
  panelStyles: React.CSSProperties;
}

export class Dropdown extends Component<DropdownProps> {}
export default Dropdown;
