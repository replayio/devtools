import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import { RecordedEvent } from "protocol/RecordedEventsCache";
import Icon from "replay-next/components/Icon";
import { copyToClipboard as copyTextToClipboard } from "replay-next/components/sources/utils/clipboard";
import { requestFocusWindow } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

export default function useEventContextMenu(event: RecordedEvent) {
  const dispatch = useAppDispatch();

  const setFocusEnd = () => {
    dispatch(
      requestFocusWindow({
        end: {
          point: event.point,
          time: event.time,
        },
      })
    );
  };

  const setFocusStart = () => {
    dispatch(
      requestFocusWindow({
        begin: {
          point: event.point,
          time: event.time,
        },
      })
    );
  };

  const onCopyUrl = () => {
    if (event.kind === "navigation") {
      copyTextToClipboard(event.url);
    }
  };

  return useContextMenu(
    <>
      {event.kind === "navigation" && (
        <>
          <ContextMenuItem onSelect={onCopyUrl}>Copy this URL</ContextMenuItem>
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>
  );
}
