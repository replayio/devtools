import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { exitFocusMode, setFocusRegion, syncFocusedRegion } from "ui/actions/timeline";
import { getFocusRegionBackup, getShowFocusModeControls } from "ui/reducers/timeline";
import { UnsafeFocusRegion } from "ui/state/timeline";
import { trackEvent } from "ui/utils/telemetry";

import { PrimaryButton, SecondaryButton } from "../shared/Button";
import Icon from "../shared/Icon";

import styles from "./FocusModePopout.module.css";

export default function FocusModePopout() {
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  const dispatch = useAppDispatch();
  const focusRegionBackup = useAppSelector(getFocusRegionBackup) as UnsafeFocusRegion;

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
    trackEvent("timeline.save_focus");

    hideModal();
  };

  // Keyboard shortcuts handler.
  useEffect(() => {
    if (!showFocusModeControls) {
      return;
    }

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter": {
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

  return (
    <div className={styles.Container} style={{ bottom: `${timelineHeight}px` }}>
      <div className={styles.Mask} onClick={() => discardPendingChanges(true)} />
      <div className={styles.Content}>
        <div className={styles.IconContainer}>
          <Icon filename="focus" className={styles.Icon} />
        </div>

        <div className={styles.Text}>
          <strong>Focus mode</strong> lets you specify a region for your debugging.{" "}
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
        <PrimaryButton color="blue" onClick={savePendingChanges}>
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
