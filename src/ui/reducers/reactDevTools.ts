import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { ReactDevToolsState } from "ui/state/reactDevTools";
import { ReactDevToolsAction } from "ui/actions/reactDevTools";
import { SetCurrentPointAction } from "ui/actions/session";

export default function update(
  state = {
    annotations: [],
    hasReactComponents: false,
    reactInitPoint: null,
    protocolCheckFailed: false,
  },
  action: ReactDevToolsAction | SetCurrentPointAction
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
export const getReactInitPoint = (state: UIState) => state.reactDevTools.reactInitPoint;
export const getProtocolCheckFailed = (state: UIState) => state.reactDevTools.protocolCheckFailed;
