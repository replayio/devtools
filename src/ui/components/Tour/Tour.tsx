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
  const showBreakpointAdd = shouldShowBreakpointAdd(nags, viewMode);
  const showBreakpointEdit = shouldShowBreakpointEdit(nags, viewMode);
  const showTour = shouldShowTour(nags, viewMode);

  const [checkedItems, setCheckedItems] = useState([0]);

  const handleShowHowClick = (index: number) => {
    alert("instructional text");
  };

  const isNewUser =
    showDevtoolsNag && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit;
  const hasCompletedTour =
    !showDevtoolsNag && !showConsoleNavigate && !showBreakpointAdd && !showBreakpointEdit;

  const { dismissDevtoolsNag } = useNagDismissal();

  return (
    <div className={styles.TourBoxWrapper}>
      <div className={styles.TourBox}>
        <div className="p-3">
          {isNewUser ? (
            <>
              <div className={styles.h1}>
                <p>Hello!</p>
                <p>
                  Replay is powerful stuff, so we want to make sure to get you off on the right
                  foot.
                </p>
                <p>First things first, see that DevTools toggle at the top right?</p>
                <p>Let’s click it.</p>
              </div>
            </>
          ) : (
            <>
              <h1 className={styles.h1}>Getting started</h1>

              <ul className={styles.checklist}>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showDevtoolsNag ? "unchecked-rounded" : "checked-rounded"}
                  />
                  Open DevTools
                </li>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showConsoleNavigate ? "unchecked-rounded" : "checked-rounded"}
                  />
                  Time travel in the console
                </li>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showBreakpointAdd ? "unchecked-rounded" : "checked-rounded"}
                  />{" "}
                  Magic print statements{" "}
                </li>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showBreakpointEdit ? "unchecked-rounded" : "checked-rounded"}
                  />{" "}
                  Edit a print statement
                </li>
                <li>
                  <Icon
                    className={styles.Icon}
                    type={showTour ? "unchecked-rounded" : "checked-rounded"}
                  />{" "}
                  Finish tour
                </li>
              </ul>
            </>
          )}

          {hasCompletedTour ? (
            <div className="mt-8 rounded-md bg-yellow-200 p-2 text-lg text-black">
              Congratulations! You completed the checklist! Confetti and stuff!
              <p>
                Let’s{" "}
                <a href="#" onClick={dismissDevtoolsNag}>
                  dismiss it
                </a>
                .
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Checklist;
