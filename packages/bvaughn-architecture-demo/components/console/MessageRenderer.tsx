import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import Loader from "../Loader";
import { memo, Suspense, useContext, useMemo } from "react";

import { ReplayClientContext } from "../../../shared/client/ReplayClientContext";

import Inspector from "../inspector";

import styles from "./MessageRenderer.module.css";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function MessageRenderer({ message }: { message: ProtocolMessage }) {
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

  const client = useContext(ReplayClientContext);
  const pauseId = useMemo(() => client.getPauseIdForMessage(message), [client, message]);

  return (
    <div className={className}>
      {message.text}
      <Suspense fallback={<Loader />}>
        {message.argumentValues?.map((argumentValue: ProtocolValue, index: number) => (
          <Inspector key={index} pauseId={pauseId} protocolValue={argumentValue} />
        ))}
      </Suspense>
    </div>
  );
}

export default memo(MessageRenderer);
