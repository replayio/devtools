import {
  PauseId,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { useContext } from "react";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import protocolValueToCopyLabel from "replay-next/components/inspector/protocolValueToCopyLabel";
import protocolValueToText from "replay-next/components/inspector/protocolValueToText";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useInspectorContextMenu({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
}) {
  const client = useContext(ReplayClientContext);

  const label = protocolValueToCopyLabel(client, protocolValue, pauseId) || "value";

  const onCopyValue = async () => {
    const valueToCopy = await protocolValueToText(client, protocolValue, pauseId);
    if (valueToCopy !== null) {
      copyTextToClipboard(valueToCopy);
    }
  };

  return useContextMenu(
    <>
      <ContextMenuItem onClick={onCopyValue}>Copy {label}</ContextMenuItem>
    </>
  );
}
