import React, { ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import {
  getAwaitingSourcemaps,
  getDisplayedLoadingProgress,
  getLoadingFinished,
  getUploading,
} from "ui/reducers/app";
import { UIState } from "ui/state";
import LoadingTip from "./LoadingTip";
import { BubbleViewportWrapper } from "./Viewport";
import ReplayLogo from "./ReplayLogo";

export function StaticLoadingScreen() {
  return <LoadingScreenTemplate />;
}

export function LoadingScreenTemplate({
  children,
  showTips,
}: {
  children?: ReactNode;
  showTips?: boolean;
}) {
  return (
    <BubbleViewportWrapper>
      <div className="relative flex w-96 flex-col items-center space-y-8 rounded-lg bg-white bg-opacity-80 p-8 py-4">
        <div className="flex flex-col items-center space-y-2">
          <ReplayLogo wide size="lg" />
          {children}
        </div>
      </div>
      {showTips ? <LoadingTip /> : null}
    </BubbleViewportWrapper>
  );
}

// White progress screen used for showing the scanning progress of a replay
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-lg bg-gray-200 p-0">
      <div
        className="t-0 absolute h-full bg-primaryAccent"
        style={{ width: `${progress}%`, transitionDuration: "400ms" }}
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

  return (
    <LoadingScreenTemplate showTips={!!progress}>
      {progress ? <ProgressBar progress={progress} /> : null}
    </LoadingScreenTemplate>
  );
}

const connector = connect((state: UIState) => ({
  uploading: getUploading(state),
  awaitingSourcemaps: getAwaitingSourcemaps(state),
  progress: getDisplayedLoadingProgress(state),
  finished: getLoadingFinished(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingScreen);
