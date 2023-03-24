import { Row } from "react-table";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

import { RequestSummary } from "./utils";

export default function useNetworkContextMenu({
  row,
  onClipboardCopy,
}: {
  row: Row<RequestSummary>;
  onClipboardCopy: (row: Row<RequestSummary>) => void;
}) {
  const dispatch = useAppDispatch();

  const beginTime = row.original?.start;
  const endTime = row.original?.end;

  const setFocusEnd = () => {
    dispatch(setFocusRegionEndTime(endTime!, true));
  };

  const setFocusStart = () => {
    dispatch(setFocusRegionBeginTime(beginTime!, true));
  };

  return useContextMenu(
    <>
      <ContextMenuItem disabled={beginTime == null} onClick={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={endTime == null} onClick={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>

      <ContextMenuItem onClick={() => onClipboardCopy(row)}>
        <>
          <Icon type="copy" />
          Copy as CURL
        </>
      </ContextMenuItem>
    </>
  );
}
