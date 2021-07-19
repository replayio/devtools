import { UIAction, UIThunkAction } from "ui/actions";
import { SourceLocation } from "ui/state/comments";

declare const _default: {
  [name: string]: (...args: any[]) => UIAction | UIThunkAction;
  selectLocation: (cx: any, location: SourceLocation) => UIThunkAction;
  togglePaneCollapse: () => UIThunkAction;
};

export default _default;
