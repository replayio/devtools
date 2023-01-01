import ContextMenuDivider from "bvaughn-architecture-demo/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "bvaughn-architecture-demo/components/context-menu/ContextMenuItem";
import useContextMenu from "bvaughn-architecture-demo/components/context-menu/useContextMenu";
import Icon from "bvaughn-architecture-demo/components/Icon";
import { copyToClipboard as copyTextToClipboard } from "bvaughn-architecture-demo/components/sources/utils/clipboard";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { ReplayEvent } from "ui/state/app";

export default function useEventContextMenu(event: ReplayEvent) {
  const dispatch = useAppDispatch();

  const setFocusEnd = () => {
    dispatch(setFocusRegionEndTime(event.time, true));
  };

  const setFocusStart = () => {
    dispatch(setFocusRegionBeginTime(event.time!, true));
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
          <ContextMenuItem onClick={onCopyUrl}>Copy this URL</ContextMenuItem>
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onClick={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onClick={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>
  );
}
