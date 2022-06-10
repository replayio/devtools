import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import {
  endTimeForFocusRegion,
  getFormattedTime,
  getSecondsFromFormattedTime,
  beginTimeForFocusRegion,
} from "ui/utils/timeline";

import EditableTimeInput from "./EditableTimeInput";
import styles from "./FocusInputs.module.css";

export default function FocusInputs() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const showFocusModeControls = useSelector(selectors.getShowFocusModeControls);
  const recordingDuration = useSelector(selectors.getRecordingDuration);

  const formattedDuration = getFormattedTime(recordingDuration || 0);
  const formattedCurrentTime = getFormattedTime(currentTime);

  // Avoid layout shift; keep input size consistent when focus mode toggles.
  const inputSize = formattedDuration.length;

  if (showFocusModeControls && focusRegion !== null) {
    const formattedEndTime = getFormattedTime(endTimeForFocusRegion(focusRegion));
    const formattedBeginTime = getFormattedTime(beginTimeForFocusRegion(focusRegion));

    const validateAndSaveBeginTime = (pending: string) => {
      try {
        const newBeginTime = getSecondsFromFormattedTime(pending);
        if (!isNaN(newBeginTime)) {
          // If the new end time is less than the current start time, the user is probably trying to move the whole range.
          // We can simplify this operation by resetting both the start and end time to the same value.
          const newEndTime =
            newBeginTime <= endTimeForFocusRegion(focusRegion!)
              ? endTimeForFocusRegion(focusRegion!)
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
            newEndTime >= beginTimeForFocusRegion(focusRegion!)
              ? beginTimeForFocusRegion(focusRegion!)
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
