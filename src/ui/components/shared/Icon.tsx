import React from "react";

const SIZES = {
  medium: { height: "20px", width: "20px" },
  small: { height: "16px", width: "16px" },
};
export default function Icon({
  filename,
  className = "bg-gray-800",
  size = "medium",
  style = {},
}: {
  size?: "small" | "medium";
  filename: string;
  className: string;
  style?: object;
}) {
  const sizeStyles = SIZES[size];
  return <div className={`icon ${filename} ${className}`} style={{ ...sizeStyles, ...style }} />;
}
