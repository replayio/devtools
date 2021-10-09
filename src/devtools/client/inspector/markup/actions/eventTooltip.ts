import { Action } from "redux";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { UIThunkAction } from "ui/actions";
import { EventInfo } from "../state/eventTooltip";

export type SetEventTooltipAction = Action<"set_event_tooltip"> & {
  nodeId: string;
  events: EventInfo[];
};
export type ClearEventTooltipAction = Action<"clear_event_tooltip">;
export type EventTooltipAction = SetEventTooltipAction | ClearEventTooltipAction;

export function setEventTooltip(nodeId: string, events: EventInfo[]): SetEventTooltipAction {
  return { type: "set_event_tooltip", nodeId, events };
}

export function clearEventTooltip(): ClearEventTooltipAction {
  return { type: "clear_event_tooltip" };
}

export function showEventTooltip(nodeId: string): UIThunkAction {
  return async ({ dispatch }) => {
    assert(ThreadFront.currentPause);
    const nodeFront = ThreadFront.currentPause.getNodeFront(nodeId);
    const listenerRaw = (await nodeFront.getEventListeners()) || [];
    const frameworkListeners = await nodeFront.getFrameworkEventListeners();

    const listenerInfo = [...listenerRaw, ...frameworkListeners].map(listener => {
      const { handler, type, capture } = listener;
      const tags = (listener as any).tags || "";
      const location = handler.functionLocation();
      const url = handler.functionLocationURL();
      let origin, line, column;

      if (location && url) {
        line = location.line;
        column = location.column;
        origin = `${url}:${line}:${column}`;
      } else {
        // We end up here for DOM0 handlers...
        origin = "[native code]";
      }

      return {
        capturing: capture,
        type,
        origin,
        url,
        line,
        column,
        tags,
        handler,
        sourceId: url ? location?.sourceId : undefined,
        native: !url,
        hide: {
          debugger: !url,
        },
      };
    });

    dispatch(setEventTooltip(nodeId, listenerInfo));
  };
}

export function viewSourceInDebugger(event: EventInfo): UIThunkAction {
  return ({ toolbox }) => {
    toolbox.viewSourceInDebugger(event.url, event.line, event.column, event.sourceId);
  };
}
