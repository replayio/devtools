import classNames from "classnames";
import { ThreadFront } from "protocol/thread";
import React, { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";

const BACKGROUNDS = {
  white: "white",
  "blue-gradient": "linear-gradient(to bottom right, #68DCFC, #4689F8)",
};

export default function BlankScreen({
  children,
  background,
  className,
}: {
  children?: React.ReactElement | React.ReactElement[];
  background?: "white" | "blue-gradient";
  className?: string;
}) {
  // Default to `blue-gradient`
  const backgroundStyle =
    background && BACKGROUNDS[background] ? BACKGROUNDS[background] : BACKGROUNDS["blue-gradient"];

  return (
    <main className={`w-full h-full grid ${className}`} style={{ background: backgroundStyle }}>
      {children}
    </main>
  );
}

// General use loading screen with an indefinite spinner, a message and a blue/white background
export function BlankLoadingScreen({
  statusMessage,
  background = "blue-gradient",
}: {
  statusMessage?: string;
  background?: "white" | "blue-gradient";
}) {
  const defaultStatusMessage = "Loading";

  // The status message is optional, and so it's possible for the loading screen spinner
  // to bounce up and down. That's why we keep a defaultStatusMessage as the div's content,
  // but keep it invisible if there's no statusMessage provided.
  return (
    <BlankScreen background={background}>
      <div className="m-auto">
        <div
          className={classNames("flex flex-col items-center space-y-4  opacity-90 rounded-md p-8", {
            "bg-white": background == "white",
          })}
        >
          <div
            className={classNames("text-xl", {
              invisible: !statusMessage,
              "text-white": background === "blue-gradient",
            })}
          >
            {statusMessage || defaultStatusMessage}
          </div>
          <Spinner
            className={classNames("animate-spin -ml-1 mr-3 h-8 w-8", {
              "text-white": background === "blue-gradient",
            })}
          />
        </div>
      </div>
    </BlankScreen>
  );
}

// White progress screen used for showing the scanning progress of a replay
export function BlankProgressScreen({
  setFinishedLoading,
  progress = 1,
}: {
  setFinishedLoading(finished: boolean): void;
  progress: number;
}) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const key = useRef<any>(null);

  useEffect(() => {
    return () => clearTimeout(key.current);
  }, []);

  useEffect(() => {
    if (displayedProgress == 100) {
      // This gives the Loader component some time (300ms) to bring the progress
      // bar to 100% before unmounting this loader and showing the application.
      setTimeout(async () => {
        await ThreadFront.initializedWaiter.promise;
        setFinishedLoading(true);
      }, 300);
    }

    // This handles the artificial progress bump. It has a randomized increment
    // whose effect is decayed as the progress approaches 100/100. Whenever the
    // underlying progress is higher than the artificial progress, we update to use
    // the underlying progress. Expected behavior assuming no underlying progress is:
    // 10s (50%) 20s (70%) 30s (85%) 45s (95%) 60s (98%)
    key.current = setTimeout(() => {
      const increment = Math.random();
      const decayed = increment * ((100 - displayedProgress) / 40);
      const newDisplayedProgress = Math.max(displayedProgress + decayed, progress);

      setDisplayedProgress(newDisplayedProgress);
    }, 200);
  }, [displayedProgress]);

  return (
    <BlankScreen background="white">
      <div className="m-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-xl">Preparing replay</div>
          <div className="w-40 relative h-1 bg-gray-200 rounded-lg overflow-hidden">
            <div
              className="absolute t-0 h-full bg-primaryAccent"
              style={{ width: `${displayedProgress}%`, transitionDuration: "200ms" }}
            />
          </div>
        </div>
      </div>
    </BlankScreen>
  );
}
