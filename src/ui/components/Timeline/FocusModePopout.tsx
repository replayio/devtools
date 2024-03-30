import { useContext, useEffect, useState } from "react";

import { assert } from "protocol/utils";
import { Button } from "replay-next/components/Button";
import { useNag } from "replay-next/src/hooks/useNag";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { exitFocusMode, requestFocusWindow, setHoverTime } from "ui/actions/timeline";
import {
  getFocusWindow,
  getShowFocusModeControls,
  isMaximumFocusWindow,
  setFocusWindow,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import Icon from "../shared/Icon";
import styles from "./FocusModePopout.module.css";

export default function FocusModePopout() {
  const replayClient = useContext(ReplayClientContext);

  const [isSavePending, setIsSavePending] = useState(false);

  const [, dismissUseFocusModeNag] = useNag(Nag.USE_FOCUS_MODE);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);

  const dispatch = useAppDispatch();
  const focusWindow = useAppSelector(getFocusWindow);
  const showMaxFocusWindowMessage = useAppSelector(isMaximumFocusWindow);

  const hideModal = () => dispatch(exitFocusMode());

  const discardPendingChanges = async (isImplicit: boolean) => {
    hideModal();

    const currentFocusWindow = replayClient.getCurrentFocusWindow();
    assert(currentFocusWindow);
    dispatch(
      setFocusWindow({ begin: currentFocusWindow.begin.time, end: currentFocusWindow.end.time })
    );

    // hoverTime may have been set by one of the focus mode time inputs
    dispatch(setHoverTime(null, false));

    if (isImplicit) {
      trackEvent("timeline.discard_focus_implicit");
    } else {
      trackEvent("timeline.discard_focus_explicit");
    }
  };

  const savePendingChanges = async () => {
    setIsSavePending(true);

    assert(focusWindow);
    await dispatch(
      requestFocusWindow({
        begin: { time: focusWindow.begin },
        end: { time: focusWindow.end },
      })
    );

    // hoverTime may have been set by one of the focus mode time inputs
    dispatch(setHoverTime(null, false));

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
          <Button color="secondary" onClick={() => discardPendingChanges(false)}>
            Cancel
          </Button>
        )}
        <Button
          data-test-id="SaveFocusModeButton"
          disabled={isSavePending}
          onClick={savePendingChanges}
        >
          {isSavePending ? "Saving" : "Save"}
        </Button>
      </div>
    </div>
  );
}
