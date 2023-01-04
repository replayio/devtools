import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
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

    // TODO [FE-989] Copy formatted data to clipboard
    console.log("copy clientValue:", clientValue);
  };

  return <ContextMenuItem onClick={onCopyValue}>Copy value</ContextMenuItem>;
}
