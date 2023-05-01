import React, { useEffect } from "react";

import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { Nag } from "ui/hooks/users";
import { useDismissNag } from "ui/hooks/users";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  shouldShowBreakpointAdd,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
} from "ui/utils/onboarding";

import styles from "./Tour.module.css";

const useNagDismissal = () => {
  const dismissNag = useDismissNag();
  const dispatch = useAppDispatch();

  const dismissTourNag = () => {
    const initialPrimaryPanel = "passport";
    dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    dismissNag(Nag.DISMISS_TOUR);
  };

  return { dismissTourNag };
};

interface IntroProps {
  typeOfReplay: string;
}

interface HelloAgainProps {
  typeOfReplay: string;
}

interface CompletedTourProps {
  setShowPassport: (newValue: boolean) => void;
  dismissTourNag: () => void;
}

const Tour: React.FC = () => {
  const { update: setShowPassport } = useFeature("showPassport");
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour =
    !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;

  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const typeOfReplay = recording && isTestSuiteReplay(recording) ? "cypress" : "events";

  const { dismissTourNag } = useNagDismissal();

  const intro = (
    <div className={styles.intro}>
      <p className={styles.h1}>Hello and welcome!</p>
      {typeOfReplay === "events" ? (
        <>
          <p>Replay is the first time-travel enabled DevTools. Let's get started!</p>
          <p>
            <em>Click on DevTools in the top right.</em>
          </p>
        </>
      ) : null}
    </div>
  );

  const helloAgain = (
    <div className={styles.intro}>
      <p className={styles.h1}>Hello again!</p>
      <p>To continue, please click the DevTools toggle at the top right.</p>
    </div>
  );

  const timeTravel = (
    <div className={styles.intro}>
      <div className={styles.h1}>Time travel 🚀</div>
      <p>In DevTools, look underneath the video to find the Replay console.</p>
      <p>
        Hover over the console and you’ll see fast-forward and rewind buttons appear on the left.
      </p>
      <p>
        <em>Click on one to time travel!</em>
      </p>
    </div>
  );

  const TimeTravelGif = () => (
    <img src="https://vercel.replay.io/tour/fast-forward.gif" className={styles.videoExample} />
  );

  const oneClickLogs = (
    <div className={styles.intro}>
      <div className={styles.h1}>
        One-click logs
        <svg className={styles.logPoint} viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 0h24v24H0z" fill="none"></path>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
        </svg>
      </div>

      <p>
        Now a file should be open in the Source Viewer. (If not, you can open a file by pressing
        command-P or clicking Sources Explorer from the left-nav)
      </p>
      <p>
        <em>Click the plus button on a line of code to set a print statement.</em>
      </p>
    </div>
  );

  const OneClickLogsGif = () => (
    <img src="https://vercel.replay.io/tour/addlogs.gif" className={styles.videoExample} />
  );

  const editLogs = (
    <div className={styles.intro}>
      <div className={styles.h1}>Pass anything! 🦄</div>
      <p>You can pass anything you want into print statements, including objects and variables.</p>
      <p>
        <em>Type something, then hit enter or click the check button.</em>
      </p>
    </div>
  );

  const EditLogsGif = () => (
    <img src="https://vercel.replay.io/tour/editlogs.gif" className={styles.videoExample} />
  );

  const CompletedTour: React.FC<CompletedTourProps> = ({ setShowPassport, dismissTourNag }) => {
    useEffect(() => {
      setShowPassport(true);
    }, [setShowPassport]);

    return (
      <div className={styles.intro}>
        <div className={styles.h1}>😎</div>
        <p>Take a look at the console.</p>
        <p>
          Replay just re-ran your recording and retroactively added your print statement each time
          that line of code was called. 🤯
        </p>
        <p>And with that, you've graduated. Happy exploring!</p>
        <p className="mt-8">
          <a
            href="#"
            onClick={e => {
              e.stopPropagation();
              setTimeout(() => {
                dismissTourNag();
              }, 200);
            }}
            className="px-3 py-1 font-medium bg-white rounded-lg shadow-lg hover:cursor-hand whitespace-nowrap text-primaryAccent hover:bg-blue-50"
          >
            Thanks!
          </a>
        </p>
        <img
          src={`/images/passport/tour_grad-default.png`}
          className={styles.largeCompletedImage}
          style={{
            zIndex: 0,
            opacity: 0.75,
            bottom: `300px`,
            transform: `rotate(14deg)`,
          }}
        />
      </div>
    );
  };

  const CompletedTourGif = () => (
    <img src="https://vercel.replay.io/tour/consoleupdate.gif" className={styles.videoExample} />
  );

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBoxGradient}>
        <div className={styles.TourBox}>
          <div className="p-2 pt-3">
            {isNewUser ? (
              intro
            ) : (
              <>
                {viewMode === "non-dev" ? (
                  helloAgain
                ) : (
                  <>
                    {showConsoleNavigate && timeTravel}
                    {!showConsoleNavigate && showBreakpointAdd && oneClickLogs}
                    {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && editLogs}
                    {hasCompletedTour && (
                      <CompletedTour
                        setShowPassport={setShowPassport}
                        dismissTourNag={dismissTourNag}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="absolute p-3 bottom-28">
        {(isNewUser || viewMode === "non-dev") && (
          <div className="relative -bottom-3">
            <img src="/images/illustrations/larry_wave.png" className="w-full z-1" />
          </div>
        )}
        {!isNewUser && viewMode !== "non-dev" && (
          <>
            {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && <TimeTravelGif />}

            {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && <EditLogsGif />}

            {!showConsoleNavigate && showBreakpointAdd && <OneClickLogsGif />}

            {hasCompletedTour && <CompletedTourGif />}
          </>
        )}
      </div>
    </div>
  );
};

export default Tour;
