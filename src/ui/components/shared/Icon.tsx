import React from "react";
export default function Icon({ filename, className = "bg-gray-800", height = 20, width = 20 }) {
  return <div className={`icon ${filename} ${className}`} style={{ height, width }} />;
}
