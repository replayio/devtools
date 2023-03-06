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

  const dismissDevtoolsNag = () => {
    dismissNag(Nag.DISMISS_TOUR);
    console.log("Dismissed probably!");

    const initialPrimaryPanel = info.isTestSuiteReplay ? "cypress" : "events";
    dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
  };
  return { dismissDevtoolsNag };
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

  const { dismissDevtoolsNag } = useNagDismissal();

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
              <span className={styles.intro}>
                <h1 className={styles.h1}>Quickstart</h1>
              </span>

              <ul className={styles.checklist}>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showDevtoolsNag ? "unchecked-rounded" : "checked-rounded"}
                  />
                  Time travel-enabled DevTools
                </li>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showConsoleNavigate ? "unchecked-rounded" : "checked-rounded"}
                  />
                  Fast-forward to any message
                </li>

                <li>
                  <Icon
                    className={styles.Icon}
                    type={showBreakpointEdit ? "unchecked-rounded" : "checked-rounded"}
                  />{" "}
                  Add logs with a single click
                </li>
              </ul>
              <div className="absolute bottom-0 left-0 w-full border-t border-primaryAccent">
                <div className="text-md italics px-4 py-6">
                  {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                    <>
                      <b>Console</b>
                      <p>
                        Hover over the lines in the console and you’ll see a fast-forward button.
                        Try clicking it!
                      </p>
                    </>
                  )}

                  {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                    <>
                      <b>Add a print statement</b>
                      <p>
                        Now you should see something like this. Whatever you type here will show up
                        in your console, so type something and hit enter.
                      </p>
                    </>
                  )}

                  {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                    <>
                      <b>Isn't that cool?</b>
                      <p>
                        Take a look at the console and you’ll see that Replay re-ran the entire
                        recording and retroactively added your print statement each time that line
                        of code was called! 🤯
                      </p>
                    </>
                  )}

                  {hasCompletedTour && (
                    <>
                      <b>Congratulations!</b>
                      <p>You completed the checklist!</p>
                      <p className="mt-3">
                        <a href="#" onClick={dismissDevtoolsNag} className="underline">
                          Click to dismiss
                        </a>
                      </p>
                    </>
                  )}
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

                  {hasCompletedTour && (
                    <img src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2MxYmNhMDQzNDhmZTE0MjQ1NzY4OTQ0NGZjYTJjMzFhMjNjODMxYiZjdD1n/1KwQEj4MoTmZPSL5bs/giphy.gif" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checklist;
