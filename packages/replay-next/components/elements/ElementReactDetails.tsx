import { ObjectId } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { domReactCache } from "replay-next/components/elements/suspense/DOMReactCache";
import Icon from "replay-next/components/Icon";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./ElementReactDetails.module.css";

type Props = { nodeId: ObjectId; viewReactComponent: (id: number) => void };

export function ElementReactDetails(props: Props) {
  return (
    <Suspense fallback={<LoadingProgressBar />}>
      <ElementReactDetailsSuspends {...props} />
    </Suspense>
  );
}

function ElementReactDetailsSuspends({ nodeId, viewReactComponent }: Props) {
  const replayClient = useContext(ReplayClientContext);

  const { pauseId } = useMostRecentLoadedPause() ?? {};

  const [objectId, displayName] = pauseId ? domReactCache.read(replayClient, pauseId, nodeId) : [];
  if (objectId == null) {
    return null;
  }

  const onClick = () => {
    viewReactComponent(objectId);
  };

  return (
    <div className={styles.Details} onClick={onClick}>
      <Icon className={styles.ReactIcon} type="react" /> Rendered by{" "}
      <code className={styles.ComponentName}>{displayName ?? "(anonymous)"}</code>{" "}
      <Icon className={styles.ViewComponentIcon} type="view-component-source" />
    </div>
  );
}

function noop(value: boolean | ((value: boolean) => void)) {}
