import classNames from "classnames";
import React from "react";
import MaterialIcon from "./MaterialIcon";

export function TrialEnd({
  expiresIn,
  color = "gray",
  className,
  onClick,
}: {
  expiresIn: number;
  color?: "yellow" | "gray";
  className?: string;
  onClick?: () => void;
}) {
  const style = {
    backgroundColor: color === "yellow" ? "#FFFB96" : "#E9E9EB",
    cursor: onClick ? "pointer" : "default",
  };

  if (expiresIn >= 21) {
    return null;
  }

  return (
    <div
      className={classNames("py-1 p-4 rounded-lg flex flex-row space-x-2 items-center", className)}
      style={style}
      onClick={onClick}
    >
      <MaterialIcon iconSize="xl">timer</MaterialIcon>
      <span className="overflow-hidden whitespace-pre overflow-ellipsis">
        {expiresIn > 1 ? (
          <span>Trial expires in {expiresIn} days</span>
        ) : expiresIn == 1 ? (
          <span>Trial expires in 1 day</span>
        ) : (
          <span>Trial expired</span>
        )}
      </span>
    </div>
  );
}
