import React, { useState } from "react";

import Icon from "replay-next/components/Icon";
import { setViewMode } from "ui/actions/layout";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import Events from "ui/components/Events";
import { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
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
    dismissNag(Nag.DISMISS_TOUR);

    const initialPrimaryPanel = info.isTestSuiteReplay ? "cypress" : "events";
    dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
  };
  return { dismissTourNag };
};

const Checklist: React.FC = () => {
  const { nags } = hooks.useGetUserInfo();
  const viewMode = useAppSelector(getViewMode);
  const showDevtoolsNag = shouldShowDevToolsNag(nags, viewMode);

  const showConsoleNavigate = shouldShowConsoleNavigate(nags);
  const showBreakpointAdd = shouldShowBreakpointAdd(nags);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags);
  const showTour = shouldShowTour(nags);

  const [checkedItems, setCheckedItems] = useState([0]);

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour =
    !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;

  const { dismissTourNag } = useNagDismissal();

  console.log("showDevtoolsNag:", showDevtoolsNag);
  console.log("showConsoleNavigate:", showConsoleNavigate);
  console.log("showBreakpointAdd:", showBreakpointAdd);
  console.log("showBreakpointEdit:", showBreakpointEdit);

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBox}>
        <div className="p-3">
          {isNewUser ? (
            <>
              <div className={styles.intro}>
                <p className={styles.h1}>Hello and welcome!</p>
                <p>
                  Replay is the first time-travel enabled DevTools. It’s designed to be familiar,
                  futuristic, and fun :)
                </p>
                <p>To get started, click on DevTools in the top right.</p>
              </div>

              <div className={styles.Larry}>
                <img src="/images/illustrations/tour2.png" />
              </div>
            </>
          ) : (
            <>
              <div className={styles.intro}>
                {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>Console</div>
                    <p>
                      Look underneath the video and introduce yourself to the Replay console. Hover
                      over the lines in the console and you’ll see a fast-forward button. Click it!
                    </p>
                  </>
                )}

                {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>Add a print statement</div>
                    <p>
                      Now click the plus button on a line of code to set a print statement. This is
                      where it gets interesting.
                    </p>
                  </>
                )}

                {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                  <>
                    <div className={styles.h1}>Edit a print statement</div>
                    <p>
                      Now you should see a textfield for making a print statement. You can pass
                      anything you want here, including passing objects. Later we can even show you
                      how to add a unicorn.
                    </p>
                  </>
                )}

                {hasCompletedTour && (
                  <>
                    <div className={styles.h1}>Cool, eh?</div>
                    <p>
                      Take a look at the console and you’ll see that Replay re-ran the entire
                      recording and retroactively added your print statement each time that line of
                      code was called! 🤯
                    </p>

                    <p className="mt-6">
                      <a
                        href="#"
                        onClick={dismissTourNag}
                        className="rounded-lg bg-primaryAccent px-3 py-1 text-white hover:bg-primaryAccentHover"
                      >
                        All done, dismiss the tour!
                      </a>
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="relative">
        <span className="text-mg absolute right-0 bottom-0 bg-pink-500 p-1 text-white">
          these are temporary gifs, stay tuned
        </span>
        {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
          <img src="/images/tour/fast-forward.gif" />
        )}

        {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
          <img src="/images/tour/addlogs.gif" />
        )}

        {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
          <img src="/images/tour/editlogs.gif" />
        )}

        {hasCompletedTour && <img src="/images/tour/consoleupdate.gif" />}
      </div>
    </div>
  );
};

export default Checklist;
