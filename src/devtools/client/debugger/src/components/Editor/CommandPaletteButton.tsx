import React from "react";
import classNames from "classnames";

import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getSelectedSource } from "ui/reducers/sources";
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
      <div className="img palette" style={{ height: "24px", width: "24px" }} />
    </button>
  );
}
