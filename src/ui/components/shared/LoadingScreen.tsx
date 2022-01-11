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
  return (
    <LoadingScreenTemplate>
      <div className="w-56 h-1"></div>
    </LoadingScreenTemplate>
  );
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
      <div className="p-9 pt-4 text-2xl relative flex flex-col items-center space-y-8 rounded-lg bg-opacity-80 bg-white w-96">
        <div className="flex-col items-center space-y-2">
          <ReplayLogo wide="true" size="lg" />
          {children}
        </div>
      </div>
      <div className="mt-4 pt-4 pl-6 pr-8 relative flex flex-col items-center space-y-8 rounded-lg bg-opacity-80 bg-white w-96 h-32 min-h-full">
        <LoadingTip />
      </div>
    </BubbleViewportWrapper>
  );
}

// White progress screen used for showing the scanning progress of a replay
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="bg-gray-200 rounded-lg overflow-hidden w-86 relative h-1.5 p-0">
      <div
        className="absolute t-0 h-full bg-primaryAccent"
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
        <div>Uploading sourcemaps</div>
      </LoadingScreenTemplate>
    );
  } else if (uploading) {
    const amount = `${Math.round(+uploading.amount)}Mb`;
    const message = amount ? `Uploading ${amount}` : "Uploading";

    return (
      <LoadingScreenTemplate>
        <div>{message}</div>
      </LoadingScreenTemplate>
    );
  }

  return (
    <LoadingScreenTemplate showTips={!!progress}>
      <div className="w-full h-1">{progress ? <ProgressBar progress={progress} /> : null}</div>
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
