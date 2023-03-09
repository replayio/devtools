import { useMemo } from "react";
import { Row } from "react-table";

import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { setFocusRegionBeginTime, setFocusRegionEndTime } from "ui/actions/timeline";
import { getCopyCUrlAbleById, getRequestBodies } from "ui/reducers/network";
import { useAppDispatch } from "ui/setup/hooks";
import { useAppSelector } from "ui/setup/hooks";

import {
  BodyPartsToUInt8Array,
  RawToImageMaybe,
  RawToUTF8,
  StringToObjectMaybe,
  URLEncodedToPlaintext,
} from "./content";
import { RequestSummary, findHeader } from "./utils";

export default function useNetworkContextMenu(row: Row<RequestSummary>) {
  const dispatch = useAppDispatch();
  const data = row.original;

  const beginTime = row.original?.start;
  const endTime = row.original?.end;

  const setFocusEnd = () => {
    dispatch(setFocusRegionEndTime(endTime!, true));
  };

  const setFocusStart = () => {
    dispatch(setFocusRegionBeginTime(beginTime!, true));
  };

  // if this request type is asset, it will not include request headers
  const isAsset = [0, 2, 3, 4, 5, 6, 7, 8, 10].includes(data.type);
  // whether copy curl button is able to click
  const copyCUrlAble = useAppSelector(state => getCopyCUrlAbleById(state, data.id));

  const requestBody = useAppSelector(getRequestBodies)[data.id];

  const raw = useMemo(
    () =>
      BodyPartsToUInt8Array(
        requestBody || [],
        findHeader(data.requestHeaders, "content-type") || "unknown"
      ),
    [requestBody, data.requestHeaders]
  );
  const genCUrlText = () => {
    let curlText = `curl "${row.values.url}"`;
    if (!isAsset) {
      curlText = `curl '${row.values.url}' ${data.requestHeaders
        .map(item => `-H '${item.name}: ${item.value}'`)
        .join(" ")}`;
      if (data.hasRequestBody) {
        curlText += ` --data '${
          StringToObjectMaybe(URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(raw)))).content
        }'`;
      }
    }
    return curlText;
  };
  const copyAsCurl = async () => {
    navigator.clipboard.writeText(genCUrlText());
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
      <ContextMenuItem disabled={data.hasRequestBody ? !copyCUrlAble : false} onClick={copyAsCurl}>
        <>
          <Icon type="copy" />
          Copy as curl
        </>
      </ContextMenuItem>
    </>
  );
}
