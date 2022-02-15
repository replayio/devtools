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
    reactInitPoint: null,
    protocolCheckFailed: false,
  },
  action: ReactDevToolsAction
): ReactDevToolsState {
  switch (action.type) {
    case "add_annotations": {
      const annotations = [...state.annotations, ...action.annotations];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

      const firstOperation = annotations.find(
        annotation => annotation.message.event == "operations"
      );
      const reactInitPoint = firstOperation?.point ?? null;
      const hasReactComponents = !!reactInitPoint;

      return { ...state, annotations, hasReactComponents, reactInitPoint };
    }

    case "set_has_react_components": {
      return { ...state, hasReactComponents: action.hasReactComponents };
    }

    case "set_current_point": {
      return {
        ...state,
        currentPoint: action.currentPoint,
        protocolCheckFailed: false,
      };
    }

    case "set_protocol_fail": {
      return {
        ...state,
        protocolCheckFailed: true,
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
export const getReactInitPoint = (state: UIState) => state.reactDevTools.reactInitPoint;
export const getProtocolCheckFailed = (state: UIState) => state.reactDevTools.protocolCheckFailed;
