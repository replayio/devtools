import classNames from "classnames";
import React from "react";
import MaterialIcon from "./MaterialIcon";

function getDaysLeft(trialEndDate: string) {
  const timeLeft = new Date(trialEndDate).getTime() - new Date().getTime();
  const daysLeft = timeLeft / (1000 * 60 * 60 * 24);

  return Math.floor(daysLeft);
}

export function TrialEnd({
  trialEnds,
  color = "gray",
  className,
  onClick,
}: {
  trialEnds: string;
  color?: "yellow" | "gray";
  className?: string;
  onClick?: () => void;
}) {
  let style;

  if (color === "yellow") {
    style = { backgroundColor: "#FFFB96" };
  } else {
    style = { backgroundColor: "#E9E9EB" };
  }

  const daysLeft = getDaysLeft(trialEnds);
  if (daysLeft >= 21) {
    return null;
  }

  return (
    <div
      className={classNames("py-1 p-4 rounded-lg flex flex-row space-x-2 items-center", className)}
      style={style}
      onClick={onClick}
    >
      <MaterialIcon style={{ fontSize: "1.25rem" }}>timer</MaterialIcon>
      <span className="overflow-hidden whitespace-pre overflow-ellipsis">
        Trial expires in {daysLeft} days
      </span>
    </div>
  );
}
