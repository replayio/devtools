import {
  Object as ProtocolObject,
  ObjectId as ProtocolObjectId,
  PauseId as ProtocolPauseId,
} from "@replayio/protocol";
import { useContext } from "react";

import { ReplayClientContext } from "../../src/contexts/ReplayClientContext";
import { getObjectWithPreview } from "../../src/suspense/ObjectPreviews";

import styles from "./HTMLChildrenRenderer.module.css";
import KeyValueRenderer from "./KeyValueRenderer";

// HTML entries are a special case.
// Unlike the other property lists, HTML entries only display child nodes:
//   ▼ <ul class="SomeList">
//         <li>Text...</li>
//      ▼ <li>
//            <h3>Header</h3>
//            Text in a text node...
//         </li>
export default function HTMLChildrenRenderer({
  object,
  pauseId,
}: {
  object: ProtocolObject;
  pauseId: ProtocolPauseId;
}) {
  const childNodes = object.preview?.node?.childNodes ?? [];
  if (childNodes.length === 0) {
    return null;
  }

  return (
    <>
      {childNodes.map((objectId: ProtocolObjectId, index: number) => (
        <HTMLChildRenderer key={index} objectId={objectId} pauseId={pauseId} />
      ))}
    </>
  );
}

function HTMLChildRenderer({
  objectId,
  pauseId,
}: {
  objectId: ProtocolObjectId;
  pauseId: ProtocolPauseId;
}) {
  const client = useContext(ReplayClientContext);
  const object = getObjectWithPreview(client, pauseId, objectId, true);

  // HACK
  const protocolValue = { object: objectId };

  return (
    <KeyValueRenderer
      isNested={true}
      layout="vertical"
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );
}
