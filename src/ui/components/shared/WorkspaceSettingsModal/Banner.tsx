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
      className={classNames("flex flex-row items-center space-x-3 rounded-md p-3", {
        "bg-primaryAccent text-white": type === "primary",
        "bg-yellow-300 text-black": type === "warning",
      })}
    >
      {icon}
      <span className="flex-grow">{children}</span>
    </div>
  );
}
