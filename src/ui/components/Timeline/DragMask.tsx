import { FC, MouseEventHandler } from "react";

export const DragMask: FC<{
  onMouseUp: MouseEventHandler;
  onMouseMove: MouseEventHandler;
}> = ({ onMouseUp, onMouseMove }) => {
  // This is so that the mask would overlay the modal's mask and we can detect
  // mouse movement throughout the entire screen.
  const zIndex = 100;

  return (
    <div
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="fixed top-0 left-0 h-full w-full"
      style={{ cursor: "ew-move", zIndex }}
    />
  );
};
