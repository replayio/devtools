import React, { useEffect } from "react";

import Icon from "replay-next/components/Icon";
import { userData } from "shared/user-data/GraphQL/UserData";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { Nag, useDismissNag } from "ui/hooks/users";
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

interface CompletedTourProps {
  dismissTourNag: () => void;
}

const Tour: React.FC = () => {
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour = !showBreakpointEdit;

  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const isTest = recording ? isTestSuiteReplay(recording) : false;

  const { dismissTourNag } = useNagDismissal();

  const intro = (
    <div className={styles.intro}>
      <p className={styles.h1}>Welcome!</p>
      {isTest ? (
        <>
          <p>
            Replay lets you debug flaky tests in a familiar DevTools environment. When you’re ready
            to see our best feature, please click DevTools at the top right.
          </p>
          <p>
            <div className={styles.stepCallout}>
              <Icon className={styles.Icon} type="error" />

              <div className={styles.stepCalloutText}>Click on DevTools in the top right</div>
            </div>
          </p>
        </>
      ) : (
        <>
          <p>Replay is the first time-travel enabled DevTools. Let's get started!</p>
          <div className={styles.stepCallout}>
            <Icon className={styles.Icon} type="error" />

            <div className={styles.stepCalloutText}>Click on DevTools in the top right</div>
          </div>
        </>
      )}
    </div>
  );

  const helloAgain = (
    <div className={styles.intro}>
      <p className={styles.h1}>Hello again!</p>
      <p>To continue, please click the DevTools toggle at the top right.</p>
    </div>
  );

  const timeTravel = isTest ? (
    <div className={styles.intro}>
      <div className={styles.h1}>Time travel 🚀</div>

      <p>
        Now look underneath the video to find the Replay console, which should have messages you can
        time travel to.
      </p>

      <p>If your console is empty, open the console menu to enable a mouse event to track.</p>

      <p>
        <div className={styles.stepCallout}>
          <Icon className={styles.Icon} type="error" />
          <div className={styles.stepCalloutText}>Click a time travel button in the console</div>
        </div>
      </p>
    </div>
  ) : (
    <div className={styles.intro}>
      <div className={styles.h1}>Time travel 🚀</div>
      <p>In DevTools, look underneath the video to find the Replay console.</p>
      <p>
        <div className={styles.stepCallout}>
          <Icon className={styles.Icon} type="error" />
          <div className={styles.stepCalloutText}>
            Hover in the console and click a button to time travel!
          </div>
        </div>
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
        command-P or clicking Sources Explorer from the left nav)
      </p>
      <p>
        <div className={styles.stepCallout}>
          <Icon className={styles.Icon} type="error" />
          <div className={styles.stepCalloutText}>
            Click the plus button on a line of code to set a print statement.
          </div>
        </div>
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
        <div className={styles.stepCallout}>
          <Icon className={styles.Icon} type="error" />
          <div className={styles.stepCalloutText}>Type something and hit enter to save</div>
        </div>
      </p>
    </div>
  );

  const EditLogsGif = () => (
    <img src="https://vercel.replay.io/tour/editlogs.gif" className={styles.videoExample} />
  );

  const CompletedTour: React.FC<CompletedTourProps> = ({ dismissTourNag }) => {
    useEffect(() => {
      userData.set("feature_showPassport", true);
    }, []);

    return (
      <div className={styles.intro}>
        <div className={styles.h1}>All done 😎</div>
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
            className="hover:cursor-hand whitespace-nowrap rounded-lg bg-white px-3 py-1 font-medium text-primaryAccent shadow-lg hover:bg-blue-50"
          >
            Thanks!
          </a>
        </p>
        <img
          src={`/recording/images/passport/tour_grad-default.png`}
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
                    {!hasCompletedTour && (
                      <>
                        {showConsoleNavigate && timeTravel}
                        {!showConsoleNavigate && showBreakpointAdd && oneClickLogs}
                        {!showConsoleNavigate &&
                          !showBreakpointAdd &&
                          showBreakpointEdit &&
                          editLogs}
                      </>
                    )}
                    {hasCompletedTour && <CompletedTour dismissTourNag={dismissTourNag} />}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-28 p-3">
        {(isNewUser || viewMode === "non-dev") && (
          <div className="relative -bottom-6">
            <img src="/recording/images/illustrations/larry_wave.png" className="z-1 w-full" />
          </div>
        )}
        {!isNewUser && viewMode !== "non-dev" && (
          <>
            {!hasCompletedTour && ( // some people jump to the final step of the tour, so this lets them
              <>
                {showConsoleNavigate && <TimeTravelGif />}
                {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                  <EditLogsGif />
                )}
                {!showConsoleNavigate && showBreakpointAdd && <OneClickLogsGif />}
              </>
            )}
            {hasCompletedTour && <CompletedTourGif />}
          </>
        )}
      </div>
    </div>
  );
};

export default Tour;
