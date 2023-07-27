import React, { useEffect, useState } from "react";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { DebouncedOrThrottledFunction } from "shared/utils/function";
import { exitFocusMode, syncFocusedRegion, updateFocusWindowParam } from "ui/actions/timeline";
import {
  getFocusWindowBackup,
  getShowFocusModeControls,
  isMaximumFocusWindow,
  setFocusWindow,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AppDispatch } from "ui/setup/store";
import { trackEvent } from "ui/utils/telemetry";

import { Button, SecondaryButton } from "../shared/Button";
import Icon from "../shared/Icon";
import styles from "./FocusModePopout.module.css";

export default function FocusModePopout({
  updateFocusWindowThrottled,
}: {
  updateFocusWindowThrottled: DebouncedOrThrottledFunction<
    (dispatch: AppDispatch, begin: number, end: number) => void
  >;
}) {
  const [isSavePending, setIsSavePending] = useState(false);

  const [, dismissUseFocusModeNag] = useNag(Nag.USE_FOCUS_MODE);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  const dispatch = useAppDispatch();
  const focusWindowBackup = useAppSelector(getFocusWindowBackup);
  const showMaxFocusWindowMessage = useAppSelector(isMaximumFocusWindow);

  const hideModal = () => dispatch(exitFocusMode());

  const discardPendingChanges = async (isImplicit: boolean) => {
    hideModal();

    if (updateFocusWindowThrottled.hasPending()) {
      updateFocusWindowThrottled.cancel();
    }

    await dispatch(setFocusWindow(focusWindowBackup));
    await dispatch(syncFocusedRegion());

    if (isImplicit) {
      trackEvent("timeline.discard_focus_implicit");
    } else {
      trackEvent("timeline.discard_focus_explicit");
    }
  };

  const savePendingChanges = async () => {
    setIsSavePending(true);

    if (updateFocusWindowThrottled.hasPending()) {
      await updateFocusWindowThrottled.flush();
    }

    await dispatch(syncFocusedRegion());
    await dispatch(updateFocusWindowParam());

    trackEvent("timeline.save_focus");

    setIsSavePending(false);

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

  const message = showMaxFocusWindowMessage ? (
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

        {isSavePending || (
          <SecondaryButton color="pink" onClick={() => discardPendingChanges(false)}>
            Cancel
          </SecondaryButton>
        )}
        <Button
          color="blue"
          dataTestId="SaveFocusModeButton"
          onClick={savePendingChanges}
          size="md"
          style={isSavePending ? "disabled" : "primary"}
        >
          {isSavePending ? "Saving" : "Save"}
        </Button>
      </div>
    </div>
  );
}
