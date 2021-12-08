import { Action } from "redux";
import { getShowCommandPalette } from "ui/reducers/layout";
import { UIThunkAction } from ".";

type SetShowCommandPalette = Action<"set_show_command_palette"> & { value: boolean };

export type LayoutAction = SetShowCommandPalette;

export function setShowCommandPalette(value: boolean): SetShowCommandPalette {
  return { type: "set_show_command_palette", value };
}
export function hideCommandPalette(): SetShowCommandPalette {
  return { type: "set_show_command_palette", value: false };
}
export function toggleCommandPalette(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const showCommandPalette = getShowCommandPalette(getState());
    dispatch(setShowCommandPalette(!showCommandPalette));
  };
}
