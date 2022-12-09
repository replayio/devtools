import { Row } from "react-table";

import ContextMenuItem from "bvaughn-architecture-demo/components/context-menu/ContextMenuItem";
import useContextMenu from "bvaughn-architecture-demo/components/context-menu/useContextMenu";
import Icon from "bvaughn-architecture-demo/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

import { RequestSummary } from "./utils";

export default function useNetworkContextMenu(row: Row<RequestSummary>) {
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
    </>
  );
}
