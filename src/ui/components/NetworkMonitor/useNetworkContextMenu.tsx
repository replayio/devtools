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

  const formatRequestHeadersForCURl = (headers: Header[]) => {
    let headerString = "";
    headers.forEach(header => {
      headerString += ` -H '${header.name}: ${header.value}'`;
    });

    return headerString;
  };

  const copyAsCurl = () => {
    const {
      values: { url = "" } = {},
      original: { requestHeaders = [], id = "", hasRequestBody = false } = {},
    } = row || {};

    let requestBodyForCURL = "";
    if (hasRequestBody) {
      const contentType = findHeader(requestHeaders, "content-type") || "unknown";
      const requestBody = requestBodies[id];
      const encodedRawBody = BodyPartsToUInt8Array(requestBody ?? [], contentType);

      const decodedRawBody = URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(encodedRawBody)));
      requestBodyForCURL = ` --data-raw '${decodedRawBody.content}'`;
    }

    navigator.clipboard.writeText(
      `curl '${url}' ${formatRequestHeadersForCURl(requestHeaders)}${requestBodyForCURL}`
    );
    onClipboardCopy();
    setTimeout(() => document.getElementById("showCopied")?.classList?.remove("opacity-100"), 2000);
    setTimeout(() => document.getElementById("showCopied")?.classList?.add("opacity-0"), 2000);
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

      <ContextMenuItem onClick={copyAsCurl}>
        <>
          <Icon type="set-focus-end" />
          Copy as CURL
        </>
      </ContextMenuItem>
    </>
  );
}
