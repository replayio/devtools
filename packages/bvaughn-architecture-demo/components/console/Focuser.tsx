import React, { MutableRefObject, useContext, useEffect, useRef, useState } from "react";

import { FocusContext, SessionContext } from "../../src/contexts";
import { formatTimestamp } from "../../src/utils/time";

import styles from "./Focuser.module.css";

export default function Focuser() {
  const { duration } = useContext(SessionContext);
  const { rangeForDisplay: range, update } = useContext(FocusContext);

  const start = range === null ? 0 : range[0] / duration;
  const end = range === null ? 1 : range[1] / duration;

  const toggleFocus = () => {
    if (range === null) {
      update([start * duration, end * duration], false);
    } else {
      update(null, false);
    }
  };

  const onSliderChange = (newStart: number, newEnd: number) => {
    update([newStart * duration, newEnd * duration], true);
  };

  return (
    <div className={range === null ? styles.FocusRegionRowOff : styles.FocusRegionRowOn}>
      <button className={styles.FocusToggleButton} onClick={toggleFocus}>
        Focus {range === null ? "off" : "on"}
      </button>
      <RangeSlider
        duration={duration}
        enabled={focus !== null}
        end={end}
        onChange={onSliderChange}
        start={start}
      />
    </div>
  );
}

function RangeSlider({
  duration,
  enabled,
  end,
  onChange,
  start,
}: {
  duration: number;
  enabled: boolean;
  end: number;
  onChange: (start: number, end: number) => void;
  start: number;
}) {
  const ref = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement>;

  return (
    <>
      <div ref={ref} className={styles.RangeSlider}>
        <div
          className={styles.RangeTrackUnfocused}
          style={{
            left: 0,
            width: `${start * 100}%`,
          }}
        />
        <div
          className={styles.RangeTrackFocused}
          style={{
            left: `${start * 100}%`,
            width: `${(end - start) * 100}%`,
          }}
        />
        <div
          className={styles.RangeTrackUnfocused}
          style={{
            left: `${end * 100}%`,
            width: `${(1 - end) * 100}%`,
          }}
        />

        <div className={styles.FocusedRange} />

        <SliderThumb
          className={styles.RangeStartThumb}
          enabled={enabled}
          maximumValue={end}
          minimumValue={0}
          onChange={newStart => onChange(newStart, end)}
          parentRef={ref}
          value={start}
        />
        <SliderThumb
          className={styles.RangeEndThumb}
          enabled={enabled}
          maximumValue={1}
          minimumValue={start}
          onChange={newEnd => onChange(start, newEnd)}
          parentRef={ref}
          value={end}
        />
      </div>
      <div className={styles.FocusTimeStamps}>
        {formatTimestamp(start * duration)} – {formatTimestamp(end * duration)}
      </div>
    </>
  );
}

function SliderThumb({
  className,
  enabled,
  maximumValue,
  minimumValue,
  onChange,
  parentRef,
  value,
}: {
  className: string;
  enabled: boolean;
  maximumValue: number;
  minimumValue: number;
  onChange: (value: number) => void;
  parentRef: MutableRefObject<HTMLDivElement>;
  value: number;
}) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const parent = parentRef.current;

    if (!enabled || !isDragging || parent === null) {
      return;
    }

    // Move events happen very frequently and rarely reflect final intent.
    // We don't want to flood the backend with requests that won't even be used,
    // so we wait until the drag action has completed before applying the new range.
    const processDragUpdate = (event: MouseEvent) => {
      const { movementX, pageX } = event;
      if (movementX !== 0) {
        const bounds = parent.getBoundingClientRect();
        const relativeX = pageX - bounds.left;

        const clampedValue = Math.max(
          minimumValue,
          Math.min(maximumValue, relativeX / bounds.width)
        );

        onChange(clampedValue);
      }
    };

    const stopDrag = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseleave", stopDrag);
    window.addEventListener("mousemove", processDragUpdate);
    window.addEventListener("mouseup", stopDrag);

    return () => {
      window.removeEventListener("mouseleave", stopDrag);
      window.removeEventListener("mousemove", processDragUpdate);
      window.removeEventListener("mouseup", stopDrag);
    };
  });

  const onMouseDown = () => {
    if (enabled) {
      setIsDragging(true);
    }
  };

  return (
    <div
      className={className}
      onMouseDown={onMouseDown}
      style={{
        left: `${value * 100}%`,
        cursor: isDragging ? "grabbing" : "grab",
        pointerEvents: enabled ? "auto" : "none",
      }}
    />
  );
}
