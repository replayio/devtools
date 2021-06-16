import classNames from "classnames";
import React from "react";

export default function Modal({
  actions,
  children,
  onMaskClick = () => {},
  options = {
    maskTransparency: "transparent",
  },
}: {
  actions?: React.ReactNode;
  onMaskClick?: () => void;
  children: React.ReactElement | React.ReactElement[];
  options?: {
    maskTransparency: "transparent" | "translucent";
  };
}) {
  const { maskTransparency } = options;

  return (
    <div
      className="fixed w-full h-full grid justify-center items-center z-50"
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div
        className={classNames("bg-black w-full h-full absolute", {
          "opacity-10": maskTransparency === "translucent",
          "opacity-0": maskTransparency === "transparent",
        })}
        onClick={onMaskClick}
      />
      <div className="z-10 relative">
        {children}
        {actions ? <div className="absolute top-4 right-4">{actions}</div> : null}
      </div>
    </div>
  );
}
