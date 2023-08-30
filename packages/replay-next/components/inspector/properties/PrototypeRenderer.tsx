import { Object as ProtocolObject, PauseId as ProtocolPauseId } from "@replayio/protocol";
import { useContext } from "react";

import Expandable from "replay-next/components/Expandable";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import PropertiesRenderer, { addPathSegment } from "../PropertiesRenderer";
import styles from "./shared.module.css";

type PropertiesRendererProps = {
  path: string | undefined;
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
};

export default function PrototypeRenderer({ object, pauseId, path }: PropertiesRendererProps) {
  const client = useContext(ReplayClientContext);
  const prototypePath = addPathSegment(path, "[[Prototype]]");
  const prototypeId = object?.preview?.prototypeId ?? null;

  if (!prototypeId) {
    return null;
  }

  const prototype = objectCache.read(client, pauseId, prototypeId, "canOverflow");

  return (
    <Expandable
      children={<PropertiesRenderer object={prototype} path={prototypePath} pauseId={pauseId} />}
      header={
        <span className={styles.Prototype}>
          <span>[[Prototype]]: </span>
          {prototype.className}
        </span>
      }
      persistenceKey={prototypePath}
    />
  );
}
