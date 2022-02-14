import classNames from "classnames";
import React from "react";

export function Banner({
  children,
  icon,
  type,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  type: "warning" | "primary";
}) {
  return (
    <div
      className={classNames("rounded-md flex flex-row items-center p-3 space-x-3", {
        "bg-primaryAccent text-white": type === "primary",
        "bg-yellow-300 text-black": type === "warning",
      })}
    >
      {icon}
      <span className="flex-grow">{children}</span>
    </div>
  );
}
