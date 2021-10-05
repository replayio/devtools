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
}: {
  trialEnds: string;
  color?: "yellow" | "gray";
}) {
  let style;

  if (color === "yellow") {
    style = { backgroundColor: "#FFFB96" };
  } else {
    style = { backgroundColor: "#E9E9EB" };
  }

  return (
    <div className="py-1 p-4 rounded-lg flex flex-row space-x-2 items-center" style={style}>
      <MaterialIcon style={{ fontSize: "1.25rem" }}>timer</MaterialIcon>
      <span className="overflow-hidden whitespace-pre overflow-ellipsis">
        Trial expires in {getDaysLeft(trialEnds)} days
      </span>
    </div>
  );
}
