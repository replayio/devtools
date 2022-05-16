import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { exitFocusMode, setFocusRegion, syncFocusedRegion } from "ui/actions/timeline";
import {
  getFocusRegion,
  getFocusRegionBackup,
  getShowFocusModeControls,
} from "ui/reducers/timeline";
import { trackEvent } from "ui/utils/telemetry";

import { PrimaryButton, SecondaryButton } from "../shared/Button";
import Icon from "../shared/Icon";

export default function FocusModePopout() {
  const showFocusModeControls = useSelector(getShowFocusModeControls);

  const dispatch = useDispatch();
  const focusRegionBackup = useSelector(getFocusRegionBackup);

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

  // Dismiss modal if the "Escape" key is pressed.
  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        discardPendingChanges(true);
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
    <div
      className="absolute top-0 left-0 right-0 z-10 flex flex-col"
      style={{ bottom: `${timelineHeight}px` }}
    >
      <div className="grow bg-black opacity-10" onClick={() => discardPendingChanges(true)} />
      <div
        className="flex flex-row items-center gap-2 p-2"
        style={{
          // TODO Move to CSS class?
          backgroundColor: "var(--theme-popup-color)",
          color: "var(--theme-popup-background)",
        }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primaryAccent text-white">
          <Icon filename="focus" className="bg-iconColor" />
        </div>

        <div className="grow text-sm">
          <strong>Focus mode</strong> lets you specify a region for your debugging.{" "}
          <a
            href="https://docs.replay.io/docs/viewer-26591deb256c473a946d0f64abb67859#bf19baaa57004b0d9282cc0a02b281f5"
            rel="noreferrer noopener"
            style={{ textDecoration: "underline" }}
            target="_blank"
          >
            Learn more.
          </a>
        </div>

        <SecondaryButton color="pink" onClick={() => discardPendingChanges(false)}>
          Discard
        </SecondaryButton>
        <PrimaryButton color="blue" onClick={savePendingChanges}>
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
