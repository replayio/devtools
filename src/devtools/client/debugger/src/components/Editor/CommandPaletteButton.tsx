import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { deselectSource } from "../../actions/sources/select";
import { getSelectedSource } from "../../reducers/sources";

export default function CommandPaletteButton() {
  const selectedSource = useSelector(getSelectedSource);
  const dispatch = useDispatch();

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
