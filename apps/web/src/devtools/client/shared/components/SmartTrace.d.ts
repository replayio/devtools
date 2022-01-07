import { Component } from "react";
import { DebuggerLocation } from "devtools/client/webconsole/actions";

export interface SmartTraceStackFrame {
  filename: string;
  functionName: string;
  location?: string;
  columnNumber: number;
  lineNumber: number;
}

export interface SmartTraceProps {
  stacktrace: SmartTraceStackFrame[];
  onViewSourceInDebugger: (location: DebuggerLocation) => void;
  onReady?: () => void;
  mapSources?: boolean;
}

export default class SmartTrace extends Component<SmartTraceProps> {}
