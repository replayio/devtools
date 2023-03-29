import React, { useState } from "react";

import Icon from "replay-next/components/Icon";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { setViewMode } from "ui/actions/layout";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import Confetti from "ui/components/shared//Confetti";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { useDismissNag } from "ui/hooks/users";
import { UserInfo } from "ui/hooks/users";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ViewMode } from "ui/state/layout";
import {
  shouldShowBreakpointAdd,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowTour,
} from "ui/utils/onboarding";

import styles from "./Tour.module.css";

const useNagDismissal = () => {
  const dismissNag = useDismissNag();
  const dispatch = useAppDispatch();
  const info = useTestInfo();

  const dismissTourNag = () => {
    const initialPrimaryPanel = "events";
    dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    dismissNag(Nag.DISMISS_TOUR);
  };

  return { dismissTourNag };
};

const Tour: React.FC = () => {
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  const showTour = shouldShowTour(nags);

  const [showConfetti, setShowConfetti] = useState(false);

  const info = useTestInfo();

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour =
    !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;

  const typeOfReplay = info.isTestSuiteReplay ? "cypress" : "events";

  const { dismissTourNag } = useNagDismissal();

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBoxGradient}>
        <div className={styles.TourBox}>
          <div className="p-2 pt-3">
            {isNewUser ? (
              <div className={styles.intro}>
                <p className={styles.h1}>Hello and welcome!</p>
                {typeOfReplay === "events" ? (
                  <>
                    <p>
                      Replay is the first time-travel enabled DevTools. It’s designed to be
                      familiar, futuristic, and fun :)
                    </p>
                    <p>To get started, click on DevTools in the top right.</p>
                  </>
                ) : null}
              </div>
            ) : (
              <div className={styles.intro}>
                {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>Time travel 🚀</div>
                    <p>Look underneath the video and introduce yourself to the Replay console.</p>
                    <p>
                      Hover over the lines in the console and you’ll see a fast-forward button.
                      Click it to time travel!
                    </p>
                  </>
                )}

                {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>
                      One-click logs
                      <svg className={styles.logPoint} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                      </svg>
                    </div>
                    <p>
                      Now click the plus button on a line of code to set a print statement. Watch
                      this!
                    </p>
                  </>
                )}

                {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>One-click logs 🦄</div>
                    <p>You can pass anything you want here, including objects and variables.</p>
                    <p>Later we can even show you how to add a unicorn.</p>
                    <p>Type something here and hit enter.</p>
                  </>
                )}

                {hasCompletedTour && (
                  <>
                    <div className={styles.h1}>Cool, eh? 🤯</div>
                    <p>Take a look at the console.</p>
                    <p>
                      Replay just re-ran your recording and retroactively added your print statement
                      each time that line of code was called!
                    </p>
                    <p>
                      We call this our "ah-ha moment," and Replay is full of them. Happy exploring!
                    </p>
                    <p className="mt-20">
                      <a
                        href="#"
                        onClick={e => {
                          e.stopPropagation();
                          setShowConfetti(true);
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-28 p-3">
        {isNewUser && (
          <div className="relative -bottom-3">
            <img src="/images/illustrations/larry_wave.png" className="z-1 w-full" />
          </div>
        )}

        {!isNewUser && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
          <img
            src="https://website-git-master-recordreplay.vercel.app/tour/fast-forward.gif"
            className={styles.videoExample}
          />
        )}

        {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
          <img
            src="https://website-git-master-recordreplay.vercel.app/tour/addlogs.gif"
            className={styles.videoExample}
          />
        )}

        {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
          <img
            src="https://website-git-master-recordreplay.vercel.app/tour/editlogs.gif"
            className={styles.videoExample}
          />
        )}

        {hasCompletedTour && (
          <img
            src="https://website-git-master-recordreplay.vercel.app/tour/consoleupdate.gif"
            className={styles.videoExample}
          />
        )}
      </div>
    </div>
  );
};

export default Tour;
