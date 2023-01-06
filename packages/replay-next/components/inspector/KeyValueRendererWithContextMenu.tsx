import useInspectorContextMenu from "replay-next/components/inspector/useInspectorContextMenu";

import KeyValueRenderer from "./KeyValueRenderer";
import type { Props } from "./KeyValueRenderer";

export default function KeyValueRendererWithContextMenu(props: Props) {
  const { pauseId, protocolValue } = props;

  const { contextMenu, onContextMenu } = useInspectorContextMenu({ pauseId, protocolValue });

  return (
    <>
      <KeyValueRenderer {...props} onContextMenu={onContextMenu} />
      {contextMenu}
    </>
  );
}
