import React, { useEffect } from "react";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { exitFocusMode, syncFocusedRegion, updateFocusRegionParam } from "ui/actions/timeline";
import {
  getFocusRegionBackup,
  getShowFocusModeControls,
  isMaximumFocusRegion,
  setFocusRegion,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { PrimaryButton, SecondaryButton } from "../shared/Button";
import Icon from "../shared/Icon";
import styles from "./FocusModePopout.module.css";

export default function FocusModePopout() {
  const [useFocusModeState, dismissUseFocusModeNag] = useNag(Nag.USE_FOCUS_MODE);

  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  const dispatch = useAppDispatch();
  const focusRegionBackup = useAppSelector(getFocusRegionBackup);
  const showMaxFocusRegionMessage = useAppSelector(isMaximumFocusRegion);

  const hideModal = () => dispatch(exitFocusMode());

  const discardPendingChanges = (isImplicit: boolean) => {
    dispatch(setFocusRegion(focusRegionBackup));
    dispatch(syncFocusedRegion());

    if (isImplicit) {
      trackEvent("timeline.discard_focus_implicit");
    } else {
      trackEvent("timeline.discard_focus_explicit");
    }

    hideModal();
  };
  const savePendingChanges = () => {
    dispatch(syncFocusedRegion());
    dispatch(updateFocusRegionParam());
    trackEvent("timeline.save_focus");

    hideModal();
  };

  // Keyboard shortcuts handler.
  useEffect(() => {
    if (!showFocusModeControls) {
      return;
    }
    dismissUseFocusModeNag();

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
        case "NumpadEnter": {
          savePendingChanges();
          break;
        }
        case "Escape": {
          discardPendingChanges(true);
          break;
        }
      }
    };

    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  });

  if (!showFocusModeControls) {
    return null;
  }

  // TODO This is kind of a hack; can we use CSS for this?
  const timelineNode = document.querySelector(".timeline");
  const timelineHeight = timelineNode!.getBoundingClientRect().height;

  const message = showMaxFocusRegionMessage ? (
    "Maximum window reached."
  ) : (
    <>
      <strong>Focus mode</strong> lets you specify a region for your debugging.
    </>
  );

  return (
    <div className={styles.Container} style={{ bottom: `${timelineHeight}px` }}>
      <div className={styles.Mask} onClick={() => discardPendingChanges(true)} />
      <div className={styles.Content}>
        <div className={styles.IconContainer}>
          <Icon filename="focus" className={styles.Icon} />
        </div>

        <div className={styles.Text}>
          {message}{" "}
          <a
            href="https://docs.replay.io/reference-guide/focus-mode"
            rel="noreferrer noopener"
            style={{ textDecoration: "underline" }}
            target="_blank"
          >
            Learn more.
          </a>
        </div>

        <SecondaryButton color="pink" onClick={() => discardPendingChanges(false)}>
          Cancel
        </SecondaryButton>
        <PrimaryButton color="blue" dataTestId="SaveFocusModeButton" onClick={savePendingChanges}>
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
