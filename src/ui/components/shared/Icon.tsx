import React from "react";
export default function Icon({
  filename,
  className = "bg-gray-800",
}: {
  filename: string;
  className: string;
}) {
  return (
    <div className={`icon ${filename} ${className}`} style={{ height: "20px", width: "20px" }} />
  );
}
