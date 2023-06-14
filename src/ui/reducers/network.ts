import { NetworkAction } from "ui/actions/network";
import { UIState } from "ui/state";

export type NetworkState = {
  selectedRequestId: string | null;
};

const initialState = (): NetworkState => ({
  selectedRequestId: null,
});

export function getSelectedRequestId(state: UIState) {
  return state.network.selectedRequestId;
}

export default function (
  state: NetworkState = initialState(),
  action: NetworkAction
): NetworkState {
  switch (action.type) {
    case "HIDE_REQUEST_DETAILS":
      return {
        ...state,
        selectedRequestId: null,
      };
    case "SHOW_REQUEST_DETAILS":
      return {
        ...state,
        selectedRequestId: action.requestId,
      };
    default:
      return state;
  }
}
