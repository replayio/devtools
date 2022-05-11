import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideModal as hideModalAction } from "ui/actions/app";
import { setFocusRegion, syncFocusedRegion } from "ui/actions/timeline";
import { getFocusRegion, getFocusRegionBackup } from "ui/reducers/timeline";
import { trackEvent } from "ui/utils/telemetry";

import { PrimaryButton, SecondaryButton } from "../Button";
import MaterialIcon from "../MaterialIcon";

export default function FocusingModal() {
  const dispatch = useDispatch();
  const focusRegion = useSelector(getFocusRegion);
  const focusRegionBackup = useSelector(getFocusRegionBackup);

  const didExplicitlyDismiss = useRef<boolean>(false);

  const hideModal = () => dispatch(hideModalAction());
  const saveFocusRegion = () => {
    didExplicitlyDismiss.current = true;

    dispatch(syncFocusedRegion());
    trackEvent("timeline.save_focus");

    hideModal();
  };
  const discardFocusRegion = () => {
    didExplicitlyDismiss.current = true;

    dispatch(setFocusRegion(focusRegionBackup));
    dispatch(syncFocusedRegion());
    trackEvent("timeline.discard_focus_explicit");

    hideModal();
  };

  useEffect(
    () => () => {
      if (!didExplicitlyDismiss.current) {
        dispatch(setFocusRegion(focusRegionBackup));
        dispatch(syncFocusedRegion());
        trackEvent("timeline.discard_focus_implicit");
      }
    },
    [dispatch, focusRegionBackup]
  );

  // TODO This is kind of a hack; can we use CSS for this?
  const timelineNode = document.querySelector(".timeline");
  const timelineHeight = timelineNode!.getBoundingClientRect().height;

  // Only show discard option if there are pending changes
  const showDiscardButton =
    focusRegion !== null &&
    focusRegionBackup !== null &&
    (focusRegionBackup.startTime !== focusRegion.startTime ||
      focusRegionBackup.endTime !== focusRegion.endTime);

  return (
    <div className="pointer-events-none fixed z-50 grid h-full w-full items-center justify-center">
      <div
        className={"pointer-events-auto absolute top-0 h-full w-full bg-black opacity-50"}
        style={{ height: `calc(100% - ${timelineHeight}px)` }}
        onClick={hideModal}
      />
      <div
        className="pointer-events-auto relative flex flex-col space-y-0 overflow-hidden rounded-lg bg-themeBase-90 text-sm"
        style={{ width: "460px" }}
      >
        <div className="space-y-4 p-8">
          <div className="flex flex-row items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-primaryAccent p-1 text-white">
              <MaterialIcon>center_focus_strong</MaterialIcon>
            </div>
            <div className="text-lg">Edit Focus Mode</div>
          </div>
          <div>
            To focus your replay, <strong>click to drag</strong> or use the{" "}
            <strong>left and right handlebars</strong>.
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <PrimaryButton color="blue" onClick={saveFocusRegion}>
                Save
              </PrimaryButton>
              {showDiscardButton && (
                <SecondaryButton color="pink" onClick={discardFocusRegion}>
                  Discard changes
                </SecondaryButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
