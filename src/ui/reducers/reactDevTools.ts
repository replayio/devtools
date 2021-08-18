import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { ReactDevToolsState } from "ui/state/reactDevTools";
import { ReactDevToolsAction } from "ui/actions/reactDevTools";

export default function update(
  state = { annotations: [], currentPoint: null },
  action: ReactDevToolsAction
): ReactDevToolsState {
  switch (action.type) {
    case "add_annotations": {
      const annotations = [...state.annotations, ...action.annotations];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));
      return { ...state, annotations };
    }

    case "set_current_point": {
      return { ...state, currentPoint: action.currentPoint };
    }

    default: {
      return state;
    }
  }
}

export const getAnnotations = (state: UIState) => state.reactDevTools.annotations;
export const hasReactComponents = (state: UIState) =>
  getAnnotations(state).some(annotation => annotation.message.event === "operations");
export const getCurrentPoint = (state: UIState) => state.reactDevTools.currentPoint;
