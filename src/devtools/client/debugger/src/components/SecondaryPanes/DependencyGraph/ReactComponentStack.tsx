import { TimeStampedPoint } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { Message } from "devtools/client/debugger/src/components/SecondaryPanes/DependencyGraph/Message";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { reactComponentStackCache } from "ui/suspense/depGraphCache";

import { Item } from "./Item";

type Props = {
  timeStampedPoint: TimeStampedPoint | null;
};

export function ReactComponentStack(props: Props) {
  return (
    <Suspense fallback={<PanelLoader />}>
      <ReactComponentStackSuspends {...props} />
    </Suspense>
  );
}

function ReactComponentStackSuspends({ timeStampedPoint }: Props) {
  const replayClient = useContext(ReplayClientContext);
  const reactStackValue = reactComponentStackCache.read(replayClient, timeStampedPoint ?? null);

  if (!timeStampedPoint) {
    return <Message>Not paused at a point</Message>;
  }

  if (!reactStackValue || reactStackValue.length === 0) {
    return <Message>No frames to display</Message>;
  }

  const firstItem = reactStackValue[0];

  return (
    <>
      {firstItem && (
        <Item
          isCurrent
          location={firstItem.componentLocation}
          name={firstItem.componentName}
          timeStampedPoint={firstItem}
        />
      )}
      {reactStackValue?.map((entry, index) => (
        <Item
          key={index}
          location={entry.parentLocation}
          name={entry.parentComponentName}
          timeStampedPoint={entry}
        />
      ))}
    </>
  );
}
