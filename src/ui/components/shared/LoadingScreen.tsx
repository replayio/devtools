import dynamic from "next/dynamic";
import React, { ReactNode, useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { getAwaitingSourcemaps, getUploading } from "ui/reducers/app";
import { UIState } from "ui/state";

import { LoadingTips } from "./LoadingTips";
import { BubbleViewportWrapper } from "./Viewport";

const colorOptions: Array<"blue" | "green" | "red"> = ["blue", "green", "red"];

const Hoverboard = dynamic(() => import("./Hoverboard"), {
  ssr: false,
  loading: () => <div />,
});

export function LoadingScreenTemplate({
  children,
  showTips = true,
}: {
  children?: ReactNode;
  showTips?: boolean;
}) {
  const [hoverboardColor, setHoverboardColor] = useState(colorOptions[2]);

  const changeHoverboardColor = () => {
    const randomIndex = Math.floor(Math.random() * colorOptions.length);
    setHoverboardColor(colorOptions[randomIndex]);
  };

  useEffect(() => {
    const interval = setInterval(changeHoverboardColor, 5_000);
    return () => clearInterval(interval);
  }, [hoverboardColor]);

  return (
    <BubbleViewportWrapper>
      <div className="relative flex w-96 flex-col items-center space-y-1 rounded-lg bg-loadingBoxes p-8 py-12 shadow-sm">
        <div className="flex flex-col items-center space-y-8">
          <div className="h-32 w-32" onClick={changeHoverboardColor}>
            <Hoverboard color={hoverboardColor} />
          </div>
          {children}
        </div>
      </div>
      {showTips ? <LoadingTips /> : null}
    </BubbleViewportWrapper>
  );
}

function LoadingScreen({
  uploading,
  awaitingSourcemaps,
  fallbackMessage,
  stalledTimeout = 9000,
}: PropsFromRedux & { fallbackMessage: string; stalledTimeout?: number }) {
  // The backend send events in this order: uploading replay -> uploading sourcemaps.
  let waitingForMessage = <span>{fallbackMessage}</span>;
  if (awaitingSourcemaps) {
    waitingForMessage = <span>Uploading sourcemaps...</span>;
    stalledTimeout = Infinity;
  } else if (uploading) {
    waitingForMessage = <span>Uploading {Math.round(+uploading.amount)}Mb</span>;
    stalledTimeout = Infinity;
  }

  let [stalled, setStalled] = useState<boolean>(false);
  useEffect(() => {
    if (stalledTimeout === Infinity) {
      return;
    }

    const timeout = setTimeout(() => setStalled(true), stalledTimeout);

    return () => clearTimeout(timeout);
  }, [fallbackMessage, stalledTimeout]);

  return (
    <LoadingScreenTemplate showTips={true}>
      <span className="text-sm">{stalled ? "Reticulating splines..." : waitingForMessage}</span>
    </LoadingScreenTemplate>
  );
}

const connector = connect((state: UIState) => ({
  uploading: getUploading(state),
  awaitingSourcemaps: getAwaitingSourcemaps(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingScreen);
