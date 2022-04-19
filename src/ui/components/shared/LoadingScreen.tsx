import React, { ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import {
  getAwaitingSourcemaps,
  getDisplayedLoadingProgress,
  getLoadingFinished,
  getUploading,
} from "ui/reducers/app";
import { UIState } from "ui/state";

import { LoadingTips } from "./LoadingTips";
import ReplayLogo from "./ReplayLogo";
import { BubbleViewportWrapper } from "./Viewport";

export function LoadingScreenTemplate({
  children,
  showTips,
}: {
  children?: ReactNode;
  showTips?: boolean;
}) {
  return (
    <BubbleViewportWrapper>
      <div className="relative flex w-96 flex-col items-center space-y-8 rounded-lg bg-modalBgcolor p-8 py-4 shadow-md">
        <div className="flex flex-col items-center space-y-2">
          <ReplayLogo wide size="lg" />
          {children}
        </div>
      </div>
      {showTips ? <LoadingTips /> : null}
    </BubbleViewportWrapper>
  );
}

// White progress screen used for showing the scanning progress of a replay
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-lg bg-themeBase-90 p-0">
      <div
        className="t-0 absolute h-full bg-primaryAccent"
        style={{ transitionDuration: "400ms", width: `${progress}%` }}
      />
    </div>
  );
}

function LoadingScreen({ uploading, awaitingSourcemaps, progress }: PropsFromRedux) {
  // The backend send events in this order: uploading replay -> uploading sourcemaps.
  if (awaitingSourcemaps) {
    return (
      <LoadingScreenTemplate>
        <span>Uploading sourcemaps</span>
      </LoadingScreenTemplate>
    );
  } else if (uploading) {
    const amount = `${Math.round(+uploading.amount)}Mb`;
    const message = amount ? `Uploading ${amount}` : "Uploading";

    return (
      <LoadingScreenTemplate>
        <span>{message}</span>
      </LoadingScreenTemplate>
    );
  }

  // Right now there's no guarantee that once progress (basic processing progress)
  // is at 100% that we're ready to close the loading screen and show the replay.
  // It's possible that we're waiting on other things still (see
  // jumpToInitialPausePoint). In that scenario, the loading progress bar appears
  // to stall at 100%. This doesn't do much to fix it since it will still stall,
  // but at least it will stall at <100%.
  const adjustedProgress = Math.min(progress || 0, 90);

  return (
    <LoadingScreenTemplate showTips={!!progress}>
      {progress ? <ProgressBar progress={adjustedProgress} /> : null}
    </LoadingScreenTemplate>
  );
}

const connector = connect((state: UIState) => ({
  awaitingSourcemaps: getAwaitingSourcemaps(state),
  finished: getLoadingFinished(state),
  progress: getDisplayedLoadingProgress(state),
  uploading: getUploading(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingScreen);
