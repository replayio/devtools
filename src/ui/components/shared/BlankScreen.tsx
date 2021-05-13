import React from "react";

export default function BlankScreen({
  children,
  className,
}: {
  children?: React.ReactElement | React.ReactElement[];
  className?: string;
}) {
  return (
    <main
      className={`w-full h-full grid ${className}`}
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      {children}
    </main>
  );
}
