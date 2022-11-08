import { compareNumericStrings } from "protocol/utils";
import { ReporterAction } from "ui/actions/reporter";
import { UIState } from "ui/state";
import { ReporterState } from "ui/state/reporter";

export default function update(
  state = {
    annotations: [],
  },
  action: ReporterAction
): ReporterState {
  switch (action.type) {
    case "add_reporter_annotations": {
      const annotations = [...state.annotations, ...action.annotations];
      annotations.sort((a1, a2) => compareNumericStrings(a1.point, a2.point));

      return { ...state, annotations };
    }

    default: {
      return state;
    }
  }
}

export const getReporterAnnotations = (state: UIState) => state.reporter.annotations;
