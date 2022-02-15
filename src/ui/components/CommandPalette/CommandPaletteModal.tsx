import React from "react";
import { actions } from "ui/actions";
import { useDispatch } from "react-redux";
import CommandPalette from ".";

export function CommandPaletteModal() {
  const dispatch = useDispatch();

  const onMaskClick = () => {
    dispatch(actions.hideCommandPalette());
  };

  return (
    <div className="fixed z-50 grid h-full w-full justify-center">
      <div className="absolute h-full w-full bg-black opacity-10" onClick={onMaskClick} />
      <div className="relative z-10 mt-24" style={{ width: "400px", height: "fit-content" }}>
        <CommandPalette autoFocus />
      </div>
    </div>
  );
}
