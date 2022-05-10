import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { getFormattedTime, getSecondsFromFormattedTime } from "ui/utils/timeline";

import EditableTimeInput from "./EditableTimeInput";

export default function FocusInputs() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const isFocusing = useSelector(selectors.getIsFocusing);
  const recordingDuration = useSelector(selectors.getRecordingDuration);

  const formattedDuration = getFormattedTime(recordingDuration || 0);
  const formattedCurrentTime = getFormattedTime(currentTime);

  // Avoid layout shift; keep input size consistent when focus mode toggles.
  const inputSize = formattedDuration.length;

  if (isFocusing && focusRegion !== null) {
    const formattedEndTime = getFormattedTime(focusRegion.endTime);
    const formattedStartTime = getFormattedTime(focusRegion.startTime);

    const validateAndSaveStartTime = (pending: string) => {
      try {
        const time = getSecondsFromFormattedTime(pending);
        if (!isNaN(time)) {
          dispatch(
            setFocusRegion({
              endTime: focusRegion!.endTime,
              startTime: time,
            })
          );
        }
      } catch (error) {
        // Ignore
      }
    };
    const validateAndSaveEndTime = (pending: string) => {
      try {
        const time = getSecondsFromFormattedTime(pending);
        if (!isNaN(time)) {
          dispatch(
            setFocusRegion({
              endTime: time,
              startTime: focusRegion!.startTime,
            })
          );
        }
      } catch (error) {
        // Ignore
      }
    };

    return (
      <div className="timeline-time text-right">
        <EditableTimeInput
          className="time-current"
          defaultValue={formattedStartTime}
          size={inputSize}
          validateAndSave={validateAndSaveStartTime}
        />
        <span className="time-divider">/</span>
        <EditableTimeInput
          className="time-total"
          defaultValue={formattedEndTime}
          size={inputSize}
          validateAndSave={validateAndSaveEndTime}
        />
      </div>
    );
  } else {
    return (
      <div className="timeline-time text-right">
        <span className="time-current" style={{ width: `${inputSize}ch` }}>
          {formattedCurrentTime}
        </span>
        <span className="time-divider">/</span>
        <span className="time-total" style={{ width: `${inputSize}ch` }}>
          {formattedDuration}
        </span>
      </div>
    );
  }
}
