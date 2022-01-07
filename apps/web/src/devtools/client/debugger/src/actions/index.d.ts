import { WiredFrame } from "protocol/thread/pause";
import { UIAction, UIThunkAction } from "ui/actions";
import { SourceLocation } from "ui/state/comments";

declare const _default: {
  [name: string]: (...args: any[]) => UIAction | UIThunkAction;
  selectFrame: (cx: any, frame: WiredFrame) => UIThunkAction;
  selectLocation: (cx: any, location: SourceLocation) => UIThunkAction;
  togglePaneCollapse: () => UIThunkAction;
};

export default _default;
