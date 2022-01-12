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
    <div className="fixed w-full h-full grid justify-center z-50">
      <div className="bg-black w-full h-full absolute opacity-10" onClick={onMaskClick} />
      <div className="z-10 relative mt-24" style={{ width: "400px", height: "fit-content" }}>
        <CommandPalette autoFocus />
      </div>
    </div>
  );
}
