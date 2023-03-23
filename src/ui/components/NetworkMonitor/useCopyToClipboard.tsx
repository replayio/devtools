import { Header } from "@replayio/protocol";
import { useCallback, useEffect, useState } from "react";
import { Row } from "react-table";

import { fetchRequestBody } from "ui/actions/network";
import { getRequestBodyById } from "ui/reducers/network";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import {
  BodyPartsToUInt8Array,
  RawToImageMaybe,
  RawToUTF8,
  URLEncodedToPlaintext,
} from "./content";
import { RequestSummary, findHeader } from "./utils";

const formatRequestHeadersForCURL = (headers: Header[]) => {
  let headerString = "";
  headers.forEach(header => {
    headerString += ` -H '${header.name}: ${header.value}'`;
  });

  return headerString;
};

export default function useCopyToCliboard() {
  const [row, setRow] = useState<Row<RequestSummary> | null>(null);

  const [isCopyTriggered, setIsCopyTriggered] = useState<Boolean>(false);
  const [isCopied, setIsCopied] = useState<Boolean>(false);
  const [shouldShowLoading, setShouldShowLoading] = useState<Boolean>(false);

  const {
    values: { url = "" } = {},
    original: { requestHeaders = [], id = "", hasRequestBody = false } = {},
  } = row || {};

  const requestBody = useAppSelector(state => getRequestBodyById(state, id));
  const dispatch = useAppDispatch();

  const getCopyText = useCallback(() => {
    let requestBodyForCURL = "";

    if (hasRequestBody && requestBody) {
      const contentType = findHeader(requestHeaders, "content-type") || "unknown";
      const encodedRawBody = BodyPartsToUInt8Array(requestBody ?? [], contentType);

      const decodedRawBody = URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(encodedRawBody)));
      requestBodyForCURL = ` --data-raw '${decodedRawBody.content}'`;
    }

    return `curl '${url}' ${formatRequestHeadersForCURL(requestHeaders)}${requestBodyForCURL}`;
  }, [hasRequestBody, requestBody, requestHeaders, url]);

  const onClipboardCopy = (row: Row<RequestSummary>) => {
    setIsCopyTriggered(true);
    setRow(row);
  };

  useEffect(() => {
    if (!isCopyTriggered) {
      return;
    }

    if (shouldShowLoading) {
      dispatch(fetchRequestBody(id));
    }

    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
        setShouldShowLoading(false);
        setIsCopyTriggered(false);
      }, 3000);
      return;
    }

    if (hasRequestBody && !requestBody) {
      setIsCopied(false);
      setShouldShowLoading(true);
    } else {
      navigator.clipboard.writeText(getCopyText());
      setShouldShowLoading(false);

      setIsCopied(false);
      setTimeout(() => setIsCopied(true), 300);
    }
  }, [
    dispatch,
    getCopyText,
    hasRequestBody,
    id,
    isCopied,
    isCopyTriggered,
    requestBody,
    shouldShowLoading,
  ]);

  return {
    onClipboardCopy: onClipboardCopy,
    isCopyTriggered,
    shouldShowLoading: isCopyTriggered && shouldShowLoading,
    isCopied: isCopyTriggered && isCopied,
  };
}
