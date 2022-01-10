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
      <div className="p-9 text-2xl relative flex flex-col items-center space-y-8 rounded-lg bg-opacity-80 bg-white w-80">
        <div className="flex flex-col items-center space-y-10">
          <ReplayLogo wide="true" size="md" />
          {children}
        </div>
      </div>
      <div className="mt-4 p-9 relative flex flex-col items-center space-y-8 rounded-lg bg-opacity-80 bg-white w-80"></div>
    </BubbleViewportWrapper>
  );
}

function Logo() {
  return (
    <svg
      width="100"
      height="115"
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M44.7743 23.302L26.3329 12.5035L7.89132 1.70509C7.09151 1.23717 6.18439 0.990928 5.26104 0.991104C4.3377 0.991281 3.43065 1.23786 2.63101 1.70609C1.83138 2.17431 1.1673 2.84769 0.705483 3.65859C0.243661 4.46949 0.000348163 5.38936 0 6.32581V49.5192C0.00031049 50.4557 0.243598 51.3756 0.705404 52.1865C1.16721 52.9974 1.83128 53.6709 2.63092 54.1391C3.43057 54.6074 4.33763 54.854 5.26099 54.8541C6.18435 54.8543 7.0915 54.6081 7.89132 54.1402L26.3329 43.3417L44.7743 32.5435C45.5741 32.0752 46.2382 31.4017 46.7 30.5905C47.1618 29.7794 47.4049 28.8593 47.4049 27.9227C47.4049 26.9861 47.1618 26.066 46.7 25.2549C46.2382 24.4438 45.5741 23.7703 44.7743 23.302V23.302Z"
        fill="#F02D5E"
      />
      <path
        d="M44.7743 83.4476L26.3329 72.6494L7.89132 61.8509C7.0915 61.383 6.18434 61.1368 5.26098 61.1369C4.33762 61.1371 3.43057 61.3837 2.63092 61.852C1.83128 62.3202 1.1672 62.9936 0.705391 63.8046C0.243585 64.6155 0.00031049 65.5354 0 66.4719V109.665C0.00031049 110.602 0.243585 111.521 0.705391 112.332C1.1672 113.143 1.83128 113.817 2.63092 114.285C3.43057 114.753 4.33762 115 5.26098 115C6.18434 115 7.0915 114.754 7.89132 114.286L26.3329 103.488L44.7743 92.6893C45.5741 92.2211 46.2383 91.5475 46.7001 90.7364C47.1619 89.9252 47.405 89.0051 47.405 88.0685C47.405 87.1318 47.1619 86.2117 46.7001 85.4006C46.2383 84.5894 45.5741 83.9159 44.7743 83.4476Z"
        fill="#F02D5E"
      />
      <path
        d="M97.3694 53.3793L78.928 42.5808L60.4865 31.7826C59.6866 31.3146 58.7795 31.0684 57.8562 31.0686C56.9328 31.0688 56.0258 31.3153 55.2261 31.7836C54.4265 32.2518 53.7624 32.9252 53.3006 33.7361C52.8388 34.547 52.5955 35.4668 52.5951 36.4033V79.5967C52.5955 80.5332 52.8388 81.453 53.3006 82.2639C53.7624 83.0748 54.4265 83.7482 55.2261 84.2164C56.0258 84.6847 56.9328 84.9312 57.8562 84.9314C58.7795 84.9316 59.6866 84.6853 60.4865 84.2174L78.928 73.4192L97.3694 62.6207C98.1692 62.1525 98.8334 61.4789 99.2951 60.6678C99.7569 59.8567 100 58.9366 100 58C100 57.0634 99.7569 56.1433 99.2951 55.3322C98.8334 54.5211 98.1692 53.8475 97.3694 53.3793V53.3793Z"
        fill="#F02D5E"
      />
    </svg>
  );
}

// White progress screen used for showing the scanning progress of a replay
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="bg-gray-200 rounded-lg overflow-hidden w-56 relative h-1.5">
      <div
        className="absolute t-0 h-full bg-primaryAccent"
        style={{ width: `${progress}%`, transitionDuration: "200ms" }}
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
      <div className="w-56 h-1">{progress ? <ProgressBar progress={progress} /> : null}</div>
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
