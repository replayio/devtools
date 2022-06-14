import React from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { setFocusRegion } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import {
  displayedEndForFocusRegion,
  getFormattedTime,
  getSecondsFromFormattedTime,
  displayedBeginForFocusRegion,
} from "ui/utils/timeline";

import EditableTimeInput from "./EditableTimeInput";
import styles from "./FocusInputs.module.css";

export default function FocusInputs() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const focusRegion = useAppSelector(selectors.getFocusRegion);
  const showFocusModeControls = useAppSelector(selectors.getShowFocusModeControls);
  const recordingDuration = useAppSelector(selectors.getRecordingDuration);

  const formattedDuration = getFormattedTime(recordingDuration || 0);
  const formattedCurrentTime = getFormattedTime(currentTime);

  // Avoid layout shift; keep input size consistent when focus mode toggles.
  const inputSize = formattedDuration.length;

  if (showFocusModeControls && focusRegion !== null) {
    const formattedEndTime = getFormattedTime(displayedEndForFocusRegion(focusRegion));
    const formattedBeginTime = getFormattedTime(displayedBeginForFocusRegion(focusRegion));

    const validateAndSaveBeginTime = (pending: string) => {
      try {
        const newBeginTime = getSecondsFromFormattedTime(pending);
        if (!isNaN(newBeginTime)) {
          // If the new end time is less than the current start time, the user is probably trying to move the whole range.
          // We can simplify this operation by resetting both the start and end time to the same value.
          const newEndTime =
            newBeginTime <= displayedEndForFocusRegion(focusRegion!)
              ? displayedEndForFocusRegion(focusRegion!)
              : newBeginTime;

          dispatch(
            setFocusRegion({
              endTime: newEndTime,
              beginTime: newBeginTime,
            })
          );
        }
      } catch (error) {
        // Ignore
      }
    };
    const validateAndSaveEndTime = (pending: string) => {
      try {
        const newEndTime = getSecondsFromFormattedTime(pending);
        if (!isNaN(newEndTime)) {
          // If the new start time is greater than the current end time, the user is probably trying to move the whole range.
          // We can simplify this operation by resetting both the start and end time to the same value.
          const newBeginTime =
            newEndTime >= displayedBeginForFocusRegion(focusRegion!)
              ? displayedBeginForFocusRegion(focusRegion!)
              : newEndTime;

          dispatch(
            setFocusRegion({
              beginTime: newBeginTime,
              endTime: newEndTime,
            })
          );
        }
      } catch (error) {
        // Ignore
      }
    };

    return (
      <div className={styles.Container}>
        <EditableTimeInput
          className="text-right"
          defaultValue={formattedBeginTime}
          size={inputSize}
          validateAndSave={validateAndSaveBeginTime}
        />
        <span>/</span>
        <EditableTimeInput
          defaultValue={formattedEndTime}
          size={inputSize}
          validateAndSave={validateAndSaveEndTime}
        />
      </div>
    );
  } else {
    return (
      <div className={styles.Container}>
        <span className={styles.CurrentTimeLabel} style={{ width: `${inputSize}ch` }}>
          {formattedCurrentTime}
        </span>
        <span>/</span>
        <span className={styles.DurationLabel} style={{ width: `${inputSize}ch` }}>
          {formattedDuration}
        </span>
      </div>
    );
  }
}
