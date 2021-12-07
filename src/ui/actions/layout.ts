import { Action } from "redux";

type SetShowCommandPalette = Action<"set_show_command_palette"> & { value: boolean };

export type LayoutAction = SetShowCommandPalette;

export function setShowCommandPalette(value: boolean): SetShowCommandPalette {
  return { type: "set_show_command_palette", value };
}
