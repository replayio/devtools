import React from "react";

const SIZES = {
  small: { height: "16px", width: "16px" },
  medium: { height: "20px", width: "20px" },
};
export default function Icon({
  filename,
  className = "bg-gray-800",
  size = "medium",
}: {
  size?: "small" | "medium";
  filename: string;
  className: string;
}) {
  const sizeStyles = SIZES[size];
  return <div className={`icon ${filename} ${className}`} style={{ ...sizeStyles }} />;
}
