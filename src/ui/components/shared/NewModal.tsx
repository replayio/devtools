import classNames from "classnames";
import React from "react";

export default function Modal({
  children,
  options = {
    maskTransparency: "transparent",
  },
}: {
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
          "opacity-5": maskTransparency === "translucent",
          "opacity-0": maskTransparency === "transparent",
        })}
      />
      <div className="z-10">{children}</div>
    </div>
  );
}
