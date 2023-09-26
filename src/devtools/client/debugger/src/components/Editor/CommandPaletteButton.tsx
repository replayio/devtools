import classNames from "classnames";
import React from "react";

import { getSelectedSourceId } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { deselectSource } from "../../actions/sources/select";

export default function CommandPaletteButton() {
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const dispatch = useAppDispatch();

  const showCommandPalette = () => dispatch(deselectSource());

  return (
    <button
      className={classNames("command-palette cursor-auto", { active: !selectedSourceId })}
      onClick={showCommandPalette}
    >
      <div className="img replay-logo" style={{ height: "20px", width: "20px" }} />
    </button>
  );
}
