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

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBoxGradient}>
        <div className={styles.TourBox}>
          <div className="p-2 pt-3">
            <div className={styles.intro}>
              {isNewUser ? (
                <>
                  <p className={styles.h1}>Hello and welcome!</p>
                  {typeOfReplay === "events" ? (
                    <>
                      <p>Replay is the first time-travel enabled DevTools. Let's get started!</p>
                      <p>
                        <em>Click on DevTools in the top right.</em>
                      </p>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  {viewMode === "non-dev" ? (
                    <>
                      <div className={styles.h1}>Oh, hi again!</div>
                      <p>To continue, please click the DevTools toggle at the top right.</p>
                    </>
                  ) : (
                    <>
                      {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                        <>
                          <div className={styles.h1}>
                            One-click logs
                            <svg
                              className={styles.logPoint}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M0 0h24v24H0z" fill="none"></path>
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                            </svg>
                          </div>
                          <p>
                            Now click the plus button on a line of code to set a print statement.
                          </p>
                        </>
                      )}

                      {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                        <>
                          <div className={styles.h1}>One-click logs 🦄</div>
                          <p>
                            You can pass anything you want here, including objects and variables.
                          </p>
                          <p>
                            <em>Type something, then hit enter or click the check button.</em>
                          </p>
                        </>
                      )}

                      {hasCompletedTour && (
                        <>
                          <div className={styles.h1}>Check it out!</div>
                          <p>Take a look at the console.</p>
                          <p>
                            Replay just re-ran your recording and retroactively added your print
                            statement each time that line of code was called. 🤯
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
                              className="hover:cursor-hand relative whitespace-nowrap rounded-lg bg-white px-3 py-1 font-medium text-primaryAccent shadow-lg hover:bg-blue-50"
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
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-28 p-3">
        {isNewUser || viewMode === "non-dev" ? (
          <div className="relative -bottom-3">
            <img src="/images/illustrations/larry_wave.png" className="z-1 w-full" />
          </div>
        ) : (
          <>
            {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
              <img
                src="https://vercel.replay.io/tour/addlogs.gif"
                className={styles.videoExample}
              />
            )}

            {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
              <img
                src="https://vercel.replay.io/tour/editlogs.gif"
                className={styles.videoExample}
              />
            )}

            {hasCompletedTour && (
              <img
                src="https://vercel.replay.io/tour/consoleupdate.gif"
                className={styles.videoExample}
              />
            )}

            {viewMode === "dev" &&
              showConsoleNavigate &&
              showBreakpointAdd &&
              showBreakpointEdit && (
                <img
                  src="https://vercel.replay.io/tour/fast-forward.gif"
                  className={styles.videoExample}
                />
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tour;
