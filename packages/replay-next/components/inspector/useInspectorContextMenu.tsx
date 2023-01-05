import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import { dateProtocolObjectToString } from "replay-next/components/inspector/values/DateRenderer";
import { errorProtocolObjectToString } from "replay-next/components/inspector/values/ErrorRenderer";
import { regExpProtocolObjectToString } from "replay-next/components/inspector/values/RegExpRenderer";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { getCachedObject } from "replay-next/src/suspense/ObjectPreviews";
import { protocolValueToClientValue } from "replay-next/src/utils/protocol";

export default function useInspectorContextMenu({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
}) {
  return useContextMenu(
    <>
      <CopyContextMenuItem pauseId={pauseId} protocolValue={protocolValue} />
    </>
  );
}

function CopyContextMenuItem({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
}) {
  const onCopyValue = () => {
    const clientValue = protocolValueToClientValue(pauseId, protocolValue);

    if (clientValue.objectId) {
      let valueToCopy: string | null = null;

      const object = getCachedObject(pauseId, clientValue.objectId);
      if (object) {
        switch (clientValue.type) {
          case "array":
            console.log("TODO [FE-989]", object);
            break;
          case "date":
            valueToCopy = dateProtocolObjectToString(object);
            break;
          case "error":
            valueToCopy = errorProtocolObjectToString(object);
            break;
          case "function":
            // Nothing meaningful to copy
            break;
          case "html-element":
          case "html-text":
            console.log("TODO [FE-989]", object);
            break;
          case "map":
            console.log("TODO [FE-989]", object);
            break;
          case "regexp":
            valueToCopy = regExpProtocolObjectToString(object);
            break;
          case "set":
            console.log("TODO [FE-989]", object);
            break;
          case "object":
            console.log("TODO [FE-989]", object);
            break;
        }
      }

      if (valueToCopy != null) {
        copyTextToClipboard(valueToCopy);
      } else {
        // Nothing meaningful to copy
      }
    } else if (clientValue.preview) {
      copyTextToClipboard(clientValue.preview);
    } else {
      // Nothing meaningful to copy
    }
  };

  return <ContextMenuItem onClick={onCopyValue}>Copy value</ContextMenuItem>;
}
