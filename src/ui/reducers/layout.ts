import { UIState } from "ui/state";
import { LayoutState } from "ui/state/layout";
import { LayoutAction } from "ui/actions/layout";

function initialLayoutState(): LayoutState {
  return {
    showCommandPalette: false,
  };
}

export default function update(state = initialLayoutState(), action: LayoutAction): LayoutState {
  switch (action.type) {
    case "set_show_command_palette": {
      return {
        ...state,
        showCommandPalette: action.value,
      };
    }

    default: {
      return state;
    }
  }
}

export const getShowCommandPalette = (state: UIState) => state.layout.showCommandPalette;
