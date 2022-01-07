import { Component, ReactElement } from "react";

interface SplitBoxProps {
  className?: string;
  initialSize?: string;
  initialWidth?: number | string;
  initialHeight?: number | string;
  startPanel?: ReactElement;
  minSize?: number | string;
  maxSize?: number | string;
  endPanel?: ReactElement;
  endPanelControl?: boolean;
  splitterSize?: number;
  vert?: boolean;
  style?: object;
  onControlledPanelResized?: Function;
  onSelectContainerElement?: any;
  onMove?: Function;
}

interface SplitBoxState {
  endPanelControl: boolean;
  splitterSize: number;
  vert: boolean;
  defaultCursor?: string;
  width: number;
  height: number;
}

declare class SplitBox extends Component<SplitBoxProps, SplitBoxState> {}
export = SplitBox;
