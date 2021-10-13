import React from "react";

export default function Radio(overrides: React.HTMLProps<HTMLInputElement>) {
  return (
    <input
      type="radio"
      className="focus:ring-primaryAccent h-4 w-4 mt-1 text-primaryAccent border-gray-300"
      {...overrides}
    />
  );
}
