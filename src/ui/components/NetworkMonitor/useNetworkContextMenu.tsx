import { Header } from "@replayio/protocol";
import { Row } from "react-table";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { getRequestBodies } from "ui/reducers/network";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import {
  BodyPartsToUInt8Array,
  RawToImageMaybe,
  RawToUTF8,
  URLEncodedToPlaintext,
} from "./content";
import { RequestSummary, findHeader } from "./utils";

export default function useNetworkContextMenu({
  row,
  onClipboardCopy,
}: {
  row: Row<RequestSummary>;
  onClipboardCopy: () => void;
}) {
  const dispatch = useAppDispatch();
  const requestBodies = useAppSelector(getRequestBodies);

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

      <ContextMenuItem onClick={onClipboardCopy}>
        <>
          <Icon type="set-focus-end" />
          Copy as CURL
        </>
      </ContextMenuItem>
    </>
  );
}
