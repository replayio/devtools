import classNames from "classnames";
import React from "react";

export default function Modal({
  actions,
  children,
  onMaskClick = () => {},
  blurMask = true,
  options = {
    maskTransparency: "transparent",
  },
}: {
  actions?: React.ReactNode;
  onMaskClick?: () => void;
  blurMask?: boolean;
  children: React.ReactElement | React.ReactElement[];
  options?: {
    maskTransparency: "transparent" | "translucent";
  };
}) {
  const { maskTransparency } = options;
  const style = blurMask ? { backdropFilter: "blur(5px)" } : {};

  return (
    <div style={style} className="fixed w-full h-full grid justify-center items-center z-50">
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

export function ModalContent({ children }: { children: React.ReactChild | React.ReactChild[] }) {
  return (
    <div
      className="p-12 bg-white rounded-lg shadow-xl text-xl relative justify-between"
      style={{ width: "520px" }}
    >
      {children}
    </div>
  );
}
