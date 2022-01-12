import { Component } from "react";

interface SplitBoxProps {
  className?: string;
  initialSize?: any;
  initialWidth?: number;
  initialHeight?: number;
  startPanel?: any;
  startPanelCollapsed?: boolean;
  minSize?: any;
  maxSize?: any;
  endPanel?: any;
  endPanelCollapsed?: boolean;
  endPanelControl?: boolean;
  splitterSize?: number;
  splitterClass?: string;
  vert?: boolean;
  style?: object;
  onResizeEnd?: Function;
}

declare class SplitBox extends Component<SplitBoxProps> {}

export = SplitBox;
