import { FC, useEffect } from "react";

// This component is for keeping track of mouse activity even outside of the parent
// component's bounding box.
export const MouseDownMask: FC<{
  onMouseUp: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
}> = ({ onMouseUp, onMouseMove }) => {
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  return null;
};
