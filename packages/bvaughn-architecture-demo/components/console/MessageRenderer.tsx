// This component only exists to demo the architectural changes.
// It's not really meant for review.

import { Message } from "@replayio/protocol";
import { Pause, ThreadFront, ValueFront } from "protocol/thread";
import { memo, useMemo } from "react";

import { formatTimestamp } from "../../src/utils/time";

import styles from "./MessageRenderer.module.css";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function MessageRenderer({ message }: { message: Message }) {
  const { point, text } = message;

  // TODO This logic should be moved out of the view.
  // It should probably be backed by its own Suspense cache which can just-in-time load ValueFronts, e.g. loadIfNecessary()
  const valueFronts = useMemo<ValueFront[]>(() => {
    if (message.argumentValues == null) {
      return [];
    }

    const pause = new Pause(ThreadFront);
    pause.instantiate(
      message.pauseId,
      message.point.point,
      message.point.time,
      !!message.point.frame,
      message.data
    );

    return message.argumentValues.map(value => new ValueFront(pause, value));
  }, [message]);

  let className = styles.MessageRow;
  switch (message.level) {
    case "warning": {
      className = styles.MessageRowWarning;
      break;
    }
    case "error": {
      className = styles.MessageRowError;
      break;
    }
  }

  return (
    <div className={className}>
      <div className={styles.Time}>{formatTimestamp(point.time)}</div>
      {text}
      {valueFronts.map((argumentValue: any, index: number) => {
        if (argumentValue.isPrimitive()) {
          return <span key={index}>{argumentValue.primitive()}</span>;
        } else {
          return <span key={index}>Unsupported argument type</span>;
        }
      })}
    </div>
  );
}

export default memo(MessageRenderer);
