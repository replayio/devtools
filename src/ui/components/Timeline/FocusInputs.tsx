import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { getFormattedTime, getSecondsFromFormattedTime } from "ui/utils/timeline";

export default function FocusInputs() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const isFocusing = useSelector(selectors.getIsFocusing);
  const recordingDuration = useSelector(selectors.getRecordingDuration);

  const formattedDuration = getFormattedTime(recordingDuration || 0);
  const formattedTime = getFormattedTime(currentTime);

  const validateAndSaveEndTime = (pending: string) => {
    const time = getSecondsFromFormattedTime(pending);
    const isValid = time > focusRegion!.startTime && time <= recordingDuration!;
    if (isValid) {
      dispatch(
        setFocusRegion({
          endTime: time,
          startTime: focusRegion!.startTime,
        })
      );
      return getFormattedTime(time);
    } else {
      return formattedDuration;
    }
  };
  const validateAndSaveStartTime = (pending: string) => {
    const time = getSecondsFromFormattedTime(pending);
    const isValid = time < focusRegion!.endTime && time >= 0;
    if (isValid) {
      dispatch(
        setFocusRegion({
          endTime: focusRegion!.endTime,
          startTime: time,
        })
      );
      return getFormattedTime(time);
    } else {
      return formattedTime;
    }
  };

  return (
    <div
      className="timeline-time text-right"
      style={{ minWidth: `${formattedTime.length * 2 + 2}ch` }}
    >
      {isFocusing ? (
        <EditableTimeInput
          className="time-current"
          minSize={formattedDuration.length}
          formatted={formattedTime}
          validateAndSave={validateAndSaveStartTime}
        />
      ) : (
        <span className="time-current">{formattedTime}</span>
      )}
      <span className="time-divider">/</span>
      {isFocusing ? (
        <EditableTimeInput
          className="time-total"
          minSize={formattedDuration.length}
          formatted={formattedDuration}
          validateAndSave={validateAndSaveEndTime}
        />
      ) : (
        <span className="time-total">{formattedDuration}</span>
      )}
    </div>
  );
}

function EditableTimeInput({
  className,
  formatted,
  minSize,
  validateAndSave,
}: {
  className?: string;
  formatted: string;
  minSize: number;
  validateAndSave: (formatted: string) => string;
}) {
  const [pendingValue, setPendingValue] = useState<string>(formatted);

  const onBlur = (event: React.FocusEvent) => {
    setPendingValue(validateAndSave(pendingValue));
  };

  const onChange = (event: React.ChangeEvent) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (value.match(/[^0-9:]/) === null) {
      setPendingValue(value);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        setPendingValue(formatted);
        break;
      case "Enter":
        event.preventDefault();
        setPendingValue(validateAndSave(pendingValue));
        break;
    }
  };

  return (
    <input
      className={`${className} focus:outline-none" border-0 bg-themeTextFieldBgcolor p-0 text-xs text-themeTextFieldColor`}
      onBlur={onBlur}
      onChange={onChange}
      onKeyDown={onKeyDown}
      size={pendingValue.length || 1}
      style={{
        minWidth: `${minSize}ch`,
      }}
      type="text"
      value={pendingValue}
    />
  );
}
