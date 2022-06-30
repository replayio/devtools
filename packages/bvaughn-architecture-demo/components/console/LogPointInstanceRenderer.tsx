import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { LogPointInstance } from "@bvaughn/src/contexts/LogPointsContext";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { primitiveToClientValue, Value } from "@bvaughn/src/utils/protocol";
import { Value as ProtocolValue } from "@replayio/protocol";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext, useMemo } from "react";

import MessageHoverButton from "./MessageHoverButton";
import styles from "./MessageRenderer.module.css";
import Source from "./Source";

function LogPointInstanceRenderer({
  isFocused,
  logPointInstance,
}: {
  isFocused: boolean;
  logPointInstance: LogPointInstance;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { pauseId: currentPauseId } = useContext(PauseContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  // TODO (bvaughn:console:points)
  let showExpandable = false;

  // TODO (bvaughn:console:points)
  const pauseId = null;

  let className = styles.MessageRow;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }
  // TODO (bvaughn:console:points)
  //   if (currentPauseId === logPointInstance.pauseId) {
  //     className = `${className} ${styles.CurrentlyPausedAt}`;
  //   }
  let contents = null;
  if (logPointInstance.requiresAnalysis) {
    // TODO (bvaughn:console:points)
    // <Suspense fallback={<Loader />}>
    //   {logPointInstance.argumentValues?.map((argumentValue: ProtocolValue, index: number) => (
    //     <Inspector key={index} pauseId={pauseId} protocolValue={argumentValue} />
    //   ))}
    // </Suspense>
  } else {
    console.log("<LPIR>", logPointInstance.contents);
    contents = logPointInstance.contents?.map((value, index) => (
      <ClientValueValueRenderer
        key={index}
        clientValue={primitiveToClientValue(value)}
        isNested={false}
      />
    ));
  }

  const primaryContent = (
    <div className={styles.PrimaryRow}>
      <div className={styles.LogContents}>{contents}</div>
      <Suspense fallback={<Loader />}>
        <div className={styles.Source}>
          {location && <Source location={logPointInstance.point.location} />}
        </div>
      </Suspense>
    </div>
  );

  return (
    <div
      ref={ref}
      className={className}
      data-test-id="Message"
      role="listitem"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {primaryContent}
      {/* TODO (bvaughn:console:points) isHovered && (
        <MessageHoverButton message={message} pauseId={message.pauseId} messageRendererRef={ref} />
      )*/}
    </div>
  );
}

export default memo(LogPointInstanceRenderer) as typeof LogPointInstanceRenderer;
