import { Header } from "@replayio/protocol";
import { useState } from "react";
import { Row } from "react-table";

import { fetchRequestBody } from "ui/actions/network";
import { getSelectedRequestBodyForId } from "ui/reducers/network";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import {
  BodyPartsToUInt8Array,
  RawToImageMaybe,
  RawToUTF8,
  URLEncodedToPlaintext,
} from "./content";
import { RequestSummary, findHeader } from "./utils";
export default function useCopyToCliboard(row: Row<RequestSummary>) {
  const {
    values: { url = "" } = {},
    original: { requestHeaders = [], id = "", hasRequestBody = false } = {},
  } = row || {};

  const [ isCopyTriggered, setIsCopyTriggered ] = useState(false);
  const requestBody = useAppSelector(state => getSelectedRequestBodyForId(state, id));
  const dispatch = useAppDispatch();

  let isCopied = false;
  let shouldShowLoading = false;

  let requestBodyForCURL = "";

  const formatRequestHeadersForCURL = (headers: Header[]) => {
    let headerString = "";
    headers.forEach(header => {
      headerString += ` -H '${header.name}: ${header.value}'`;
    });

    return headerString;
  };

  const onClipboardCopy = () => {
    setIsCopyTriggered(true);
  };

  if (isCopyTriggered) {
    if (!hasRequestBody) {
      navigator.clipboard.writeText(
        `curl '${url}' ${formatRequestHeadersForCURL(requestHeaders)}${requestBodyForCURL}`
      );

      isCopied = true;
      shouldShowLoading = false;
      setTimeout(() => setIsCopyTriggered(false), 3000);

    } else {
      if (requestBody) {
        const contentType = findHeader(requestHeaders, "content-type") || "unknown";
        const encodedRawBody = BodyPartsToUInt8Array(requestBody ?? [], contentType);

        const decodedRawBody = URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(encodedRawBody)));
        requestBodyForCURL = ` --data-raw '${decodedRawBody.content}'`;
        navigator.clipboard.writeText(
          `curl '${url}' ${formatRequestHeadersForCURL(requestHeaders)}${requestBodyForCURL}`
        );

        isCopied = true;
        shouldShowLoading = false;
        setTimeout(() => setIsCopyTriggered(false), 3000);

      } else {
        //dispatch to fetch request body
        dispatch(fetchRequestBody(id));

        isCopied = false;
        shouldShowLoading = true;

      }
    }
  }

  return {
    onClipboardCopy: onClipboardCopy,
    isCopyTriggered,
    shouldShowLoading: isCopyTriggered && shouldShowLoading,
    isCopied: isCopyTriggered && isCopied,
  };
}
