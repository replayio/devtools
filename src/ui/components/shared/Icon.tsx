import React from "react";
export default function Icon({ filename, className = "bg-gray-800" }) {
  return (
    <div className={`icon ${filename} ${className}`} style={{ height: "20px", width: "20px" }} />
  );
}
