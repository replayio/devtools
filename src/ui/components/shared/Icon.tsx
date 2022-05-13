import React from "react";

const SIZES = {
  small: { height: "1rem", width: "1rem" },
  medium: { height: "1.25rem", width: "1.25rem" },
  large: { height: "1.5rem", width: "1.5rem" },
  "extra-large": { height: "2rem", width: "2rem" },
};
export default function Icon({
  filename,
  className = "bg-gray-800",
  size = "medium",
  style = {},
}: {
  size?: "small" | "medium" | "large" | "extra-large";
  filename: string;
  className?: string;
  style?: object;
}) {
  const sizeStyles = SIZES[size];
  return <div className={`icon ${filename} ${className}`} style={{ ...sizeStyles, ...style }} />;
}
