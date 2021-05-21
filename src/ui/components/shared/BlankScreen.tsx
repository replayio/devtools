import React from "react";
import Spinner from "./Spinner";

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

export function BlankLoadingScreen() {
  return (
    <BlankScreen>
      <div className="m-auto">
        <Spinner className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" />
      </div>
    </BlankScreen>
  );
}
