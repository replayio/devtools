import React from "react";

const icons = {
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
};

export default function JonIcon({ iconName }: { iconName: keyof typeof icons }) {
  return (
    <svg
      style={{ display: "inline-block", verticalAlign: "middle" }}
      viewBox={"0 0 24 24"}
      width={`16px`}
      height={`16px`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <path fill={"currentColor"} d={icons[iconName]} />
    </svg>
  );
}
