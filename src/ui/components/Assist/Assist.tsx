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

import styles from "./Assist.module.css";

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

  return (
    <div className={styles.AssistBoxWrapper}>
      <div className={styles.AssistBoxGradient}>
        <div className={styles.AssistBox}>
          <div className="p-0 pt-3">
            <h1 className={styles.h1}>Replay Assist</h1>

            <ul className={styles.checklist}>
              <li>Open DevTools</li>
              <li>Time travel in the console</li>
              <li>Magic print statements</li>
              <li>Add a comment </li>
              <li>... to a line of code</li>
              <li>... to a network request</li>
              <li>... to a print statement</li>
              <li>Jump to code</li>
              <li>Add a unicorn badge</li>
              <li>Record a replay</li>
              <li>Explore sources</li>
              <li>Search source text</li>
              <li>Quick-open a file</li>
              <li>Launch command palette</li>
              <li>Jump to an event</li>
              <li>Inspect an element</li>
              <li>Inspect a component</li>
              <li>Use Focus Mode</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="absolute bottom-28 p-3">
        {1 == 1 && <img src="/images/tour/fast-forward.gif" className={styles.videoExample} />}

        {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
          <img src="/images/tour/addlogs.gif" className={styles.videoExample} />
        )}

        {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
          <img src="/images/tour/editlogs.gif" className={styles.videoExample} />
        )}

        {1 != 1 && <img src="/images/tour/consoleupdate.gif" className={styles.videoExample} />}
      </div>
    </div>
  );
};

export default Tour;
