import {
  Object as ProtocolObject,
  ObjectId as ProtocolObjectId,
  PauseId as ProtocolPauseId,
} from "@replayio/protocol";
import { useContext } from "react";

import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import KeyValueRenderer from "./KeyValueRenderer";
import { addPathSegment } from "./PropertiesRenderer";

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
  path,
  pauseId,
}: {
  object: ProtocolObject;
  path?: string;
  pauseId: ProtocolPauseId;
}) {
  const childNodes = object.preview?.node?.childNodes ?? [];
  if (childNodes.length === 0) {
    return null;
  }

  return (
    <>
      {childNodes.map((objectId: ProtocolObjectId, index: number) => (
        <HTMLChildRenderer
          key={index}
          objectId={objectId}
          path={addPathSegment(path, `${index}`)}
          pauseId={pauseId}
        />
      ))}
    </>
  );
}

function HTMLChildRenderer({
  objectId,
  path,
  pauseId,
}: {
  objectId: ProtocolObjectId;
  path?: string;
  pauseId: ProtocolPauseId;
}) {
  const client = useContext(ReplayClientContext);

  // Filter out empty text nodes to avoid displaying a bunch of white space entries.
  const object = getObjectWithPreviewSuspense(client, pauseId, objectId);
  if (isEmptyTextNode(object)) {
    return null;
  }

  // HACK
  const protocolValue = { object: objectId };

  return (
    <KeyValueRenderer
      context="nested"
      layout="vertical"
      path={path}
      pauseId={pauseId}
      protocolValue={protocolValue}
    />
  );
}

function isEmptyTextNode(object: ProtocolObject): boolean {
  if (object.className === "Text") {
    const textContent = object.preview?.getterValues?.find(value => value.name === "wholeText");
    if (textContent && typeof textContent.value === "string" && textContent.value.trim() === "") {
      return true;
    }
  }

  return false;
}
