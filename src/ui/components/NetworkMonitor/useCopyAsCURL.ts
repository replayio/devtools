import { RequestBodyData } from "@replayio/protocol";
import { useState } from "react";

import { fetchRequestBody } from "ui/actions/network";
import { getRequestBodyById } from "ui/reducers/network";
import { useAppDispatch, useAppSelector, useAppStore } from "ui/setup/hooks";

import {
  BodyPartsToUInt8Array,
  RawToImageMaybe,
  RawToUTF8,
  URLEncodedToPlaintext,
} from "./content";
import { RequestSummary, findHeader } from "./utils";

type State = "ready" | "loading" | "complete" | "error";

export default function useCopyAsCURL(
  requestSummary: RequestSummary,
  resetAfterDelay: number = 2_500
): {
  copy: () => void;
  state: State;
} {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  let requestBody = useAppSelector(state => getRequestBodyById(state, requestSummary.id));

  const [state, setState] = useState<State>("ready");

  const copy = async () => {
    try {
      if (requestSummary.hasRequestBody && requestBody == null) {
        setState("loading");

        await dispatch(fetchRequestBody(requestSummary.id));

        const state = store.getState();
        requestBody = getRequestBodyById(state, requestSummary.id);
      }

      const text = formatText(requestSummary, requestBody);
      navigator.clipboard.writeText(text);

      setState("complete");
    } catch (error) {
      setState("error");
    }

    setTimeout(() => {
      setState("ready");
    }, resetAfterDelay);
  };

  return { copy, state };
}

function formatText(requestSummary: RequestSummary, requestBody: RequestBodyData[] | null) {
  const { hasRequestBody, requestHeaders, url } = requestSummary;

  const headersString = requestHeaders.map(({ name, value }) => `-H '${name}: ${value}'`).join(" ");

  let bodyString = "";
  if (hasRequestBody && requestBody) {
    const contentType = findHeader(requestHeaders, "content-type") || "unknown";
    const encodedRawBody = BodyPartsToUInt8Array(requestBody || [], contentType);

    const decodedRawBody = URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(encodedRawBody)));
    bodyString = `--data-raw '${decodedRawBody.content}'`;
  }

  return `curl '${url}' ${headersString} ${bodyString}`;
}
