import classNames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import {
  getAwaitingSourcemaps,
  getDisplayedLoadingProgress,
  getLoadingFinished,
  getUploading,
} from "ui/reducers/app";
import { UIState } from "ui/state";
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
  background = "white",
}: {
  statusMessage?: string;
  background?: "white" | "blue-gradient";
}) {
  const defaultStatusMessage = "Fetching data";

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
export function BlankProgressScreen({ progress }: { progress: number }) {
  return (
    <BlankScreen background="white">
      <div className="m-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-xl">Preparing replay</div>
          <div className="w-40 relative h-1 bg-gray-200 rounded-lg overflow-hidden">
            <div
              className="absolute t-0 h-full bg-primaryAccent"
              style={{ width: `${progress}%`, transitionDuration: "200ms" }}
            />
          </div>
        </div>
      </div>
    </BlankScreen>
  );
}

function _LoadingScreen({ uploading, awaitingSourcemaps, progress, finished }: PropsFromRedux) {
  if (!awaitingSourcemaps && !uploading && progress && !finished) {
    return <BlankProgressScreen progress={progress} />;
  }

  let message;
  let color: "blue-gradient" | "white" = "white";

  // The backend send events in this order: uploading replay -> uploading sourcemaps.
  if (awaitingSourcemaps) {
    color = "blue-gradient";
    message = "Uploading sourcemaps";
  } else if (uploading) {
    color = "blue-gradient";
    message = "Uploading replay";
  } else {
    message = "Fetching data";
  }

  return <BlankLoadingScreen statusMessage={message} background={color} />;
}

const connector = connect((state: UIState) => ({
  uploading: getUploading(state),
  awaitingSourcemaps: getAwaitingSourcemaps(state),
  progress: getDisplayedLoadingProgress(state),
  finished: getLoadingFinished(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export const LoadingScreen = connector(_LoadingScreen);
