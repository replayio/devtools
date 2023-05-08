import { Row } from "react-table";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import useCopyAsCURL from "ui/components/NetworkMonitor/useCopyAsCURL";
import { useAppDispatch } from "ui/setup/hooks";

import { RequestSummary } from "./utils";

export default function useNetworkContextMenu({ row }: { row: Row<RequestSummary> }) {
  const dispatch = useAppDispatch();

  const { copy: copyAsCURL, state } = useCopyAsCURL(row.original);

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
      <ContextMenuItem disabled={beginTime == null} onSelect={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem disabled={endTime == null} onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>

      <ContextMenuItem disabled={state !== "ready"} onSelect={copyAsCURL}>
        <>
          <Icon type="copy" />
          Copy as CURL
        </>
      </ContextMenuItem>
    </>
  );
}
