import classNames from "classnames";
import React, { HTMLProps } from "react";
import MaterialIcon from "./MaterialIcon";

export default function Modal({
  actions,
  children,
  className,
  onMaskClick = () => {},
  blurMask = true,
  options = {
    maskTransparency: "transparent",
  },
  style,
  ...props
}: {
  actions?: React.ReactNode;
  onMaskClick?: () => void;
  blurMask?: boolean;
  children: React.ReactElement | React.ReactElement[];
  options?: {
    maskTransparency: "transparent" | "translucent";
  };
} & HTMLProps<HTMLDivElement>) {
  const { maskTransparency } = options;
  const modalStyle = blurMask ? { backdropFilter: "blur(5px)", ...style } : style;

  return (
    <div
      {...props}
      style={modalStyle}
      className={classNames("fixed z-50 grid h-full w-full items-center justify-center", className)}
    >
      <div
        className={classNames("absolute h-full w-full bg-black", {
          "opacity-10": maskTransparency === "translucent",
          "opacity-0": maskTransparency === "transparent",
        })}
        onClick={onMaskClick}
      />
      <div className="relative z-10">
        {children}
        {actions ? <div className="absolute top-4 right-4">{actions}</div> : null}
      </div>
    </div>
  );
}

export function ModalContent({ children }: { children: React.ReactChild | React.ReactChild[] }) {
  return (
    <div
      className="relative justify-between rounded-lg bg-white p-9 text-lg shadow-xl"
      style={{ width: "520px" }}
    >
      {children}
    </div>
  );
}

export function ModalCloseButton({ onClose }: { onClose?: () => void }) {
  return (
    <button onClick={onClose}>
      <MaterialIcon className="align-top" iconSize="xl">
        close
      </MaterialIcon>
    </button>
  );
}
