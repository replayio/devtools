import classNames from "classnames";
import React from "react";

import { getSelectedSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { deselectSource } from "../../actions/sources/select";

export default function CommandPaletteButton() {
  const selectedSource = useAppSelector(getSelectedSource);
  const dispatch = useAppDispatch();

  const showCommandPalette = () => dispatch(deselectSource());

  return (
    <button
      className={classNames("command-palette cursor-auto", { active: !selectedSource })}
      onClick={showCommandPalette}
    >
      <div className="img replay-logo" style={{ height: "20px", width: "20px" }} />
    </button>
  );
}
