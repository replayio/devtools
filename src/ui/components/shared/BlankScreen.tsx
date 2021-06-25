import classNames from "classnames";
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

export function BlankLoadingScreen({ statusMessage }: { statusMessage?: string }) {
  const defaultStatusMessage = "Loading";

  // The status message is optional, and so it's possible for the loading screen spinner
  // to bounce up and down. That's why we keep a defaultStatusMessage as the div's content,
  // but keep it invisible if there's no statusMessage provided.
  return (
    <BlankScreen>
      <div className="m-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className={classNames("text-white text-xl", { invisible: !statusMessage })}>
            {statusMessage || defaultStatusMessage}
          </div>
          <Spinner className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" />
        </div>
      </div>
    </BlankScreen>
  );
}
