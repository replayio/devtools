import React, { useState } from "react";

import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import Confetti from "ui/components/shared//Confetti";
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

const Tour: React.FC = () => {
  const { update: setShowPassport } = useFeature("showPassport");
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);

  const [showConfetti, setShowConfetti] = useState(false);

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour =
    !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;

  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const typeOfReplay = recording && isTestSuiteReplay(recording) ? "cypress" : "events";

  const { dismissTourNag } = useNagDismissal();

  const Intro = ({ typeOfReplay }) => (
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

  const HelloAgain = ({ typeOfReplay }) => (
    <div className={styles.intro}>
      <p className={styles.h1}>Hello again!</p>
      <p>To continue, please click the DevTools toggle at the top right.</p>
    </div>
  );

  const TimeTravel = () => (
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

  const SkippedTimeTravel = () => (
    <div className={styles.intro}>
      <div className={styles.h1}>You skipped Time Travel</div>
      <p>To continue, please use the fast-forward or rewind buttons in the Replay console.</p>
    </div>
  );

  const OneClickLogs = () => (
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
      <p>Click the plus button on a line of code to set a print statement.</p>
    </div>
  );

  const OneClickLogsGif = () => (
    <img src="https://vercel.replay.io/tour/addlogs.gif" className={styles.videoExample} />
  );

  const EditLogs = () => (
    <div className={styles.intro}>
      <div className={styles.h1}>One-click logs 🦄</div>
      <p>You can pass anything you want into print statements, including objects and variables.</p>
      <p>
        <em>Type something, then hit enter or click the check button.</em>
      </p>
    </div>
  );

  const EditLogsGif = () => (
    <img src="https://vercel.replay.io/tour/editlogs.gif" className={styles.videoExample} />
  );

  const CompletedTour = ({ setShowConfetti, setShowPassport, dismissTourNag }) => (
    <div className={styles.intro}>
      <div className={styles.h1}>Check it out!</div>
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
            setShowConfetti(true);
            setShowPassport(true);
            setTimeout(() => {
              setShowConfetti(false);
              dismissTourNag();
            }, 2500);
          }}
          className="hover:cursor-hand whitespace-nowrap rounded-lg bg-white px-3 py-1 font-medium text-primaryAccent shadow-lg hover:bg-blue-50"
        >
          Thanks!
        </a>
        {showConfetti ? <Confetti /> : null}
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

  const CompletedTourGif = () => (
    <img src="https://vercel.replay.io/tour/consoleupdate.gif" className={styles.videoExample} />
  );

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBoxGradient}>
        <div className={styles.TourBox}>
          <div className="p-2 pt-3">
            {isNewUser ? (
              <Intro typeOfReplay={typeOfReplay} />
            ) : (
              <>
                {viewMode === "non-dev" ? (
                  <HelloAgain typeOfReplay={typeOfReplay} />
                ) : (
                  <>
                    {showConsoleNavigate && <TimeTravel />}
                    {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                      <OneClickLogs />
                    )}
                    {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                      <EditLogs />
                    )}
                    {hasCompletedTour && (
                      <CompletedTour
                        setShowConfetti={setShowConfetti}
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
      <div className="absolute bottom-28 p-3">
        {(isNewUser || viewMode === "non-dev") && (
          <div className="relative -bottom-3">
            <img src="/images/illustrations/larry_wave.png" className="z-1 w-full" />
          </div>
        )}
        {!isNewUser && viewMode !== "non-dev" && (
          <>
            {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && <TimeTravelGif />}
            {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && <OneClickLogsGif />}
            {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && <EditLogsGif />}
            {hasCompletedTour && <CompletedTourGif />}
          </>
        )}
      </div>
    </div>
  );
};

export default Tour;
