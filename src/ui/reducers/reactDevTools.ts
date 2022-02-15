import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { ReactDevToolsState } from "ui/state/reactDevTools";
import { ReactDevToolsAction } from "ui/actions/reactDevTools";
import { ExecutionPoint } from "@recordreplay/protocol";

export default function update(
  state = {
    annotations: [],
    currentPoint: null,
    hasReactComponents: false,
    firstOpAnnotationPoint: null,
    lastProtocolCheckFailed: false,
  },
  action: ReactDevToolsAction
): ReactDevToolsState {
  switch (action.type) {
    case "add_annotations": {
      const annotations = [...state.annotations, ...action.annotations];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

      let firstOpAnnotationPoint: ExecutionPoint | null = null;
      {
        for (const { message, point } of annotations) {
          if (message.event === "operations") {
            firstOpAnnotationPoint = point;
            break;
          }
        }
      }
      const hasReactComponents = firstOpAnnotationPoint !== null;

      return { ...state, annotations, hasReactComponents, firstOpAnnotationPoint };
    }

    case "set_has_react_components": {
      return { ...state, hasReactComponents: action.hasReactComponents };
    }

    case "set_current_point": {
      return {
        ...state,
        currentPoint: action.currentPoint,
        lastProtocolCheckFailed: false,
      };
    }

    case "set_protocol_fail": {
      return {
        ...state,
        lastProtocolCheckFailed: true,
      };
    }

    default: {
      return state;
    }
  }
}

export const getAnnotations = (state: UIState) => state.reactDevTools.annotations;
export const hasReactComponents = (state: UIState) => state.reactDevTools.hasReactComponents;
export const getCurrentPoint = (state: UIState) => state.reactDevTools.currentPoint;
export const getFirstOpAnnotations = (state: UIState) => state.reactDevTools.firstOpAnnotationPoint;
export const getLastProtocolCheckFailed = (state: UIState) =>
  state.reactDevTools.lastProtocolCheckFailed;
