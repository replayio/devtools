import { RequestBodyData } from "@replayio/protocol";
import { useContext, useState } from "react";

import { networkRequestBodyCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

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
  const replayClient = useContext(ReplayClientContext);

  const [state, setState] = useState<State>("ready");

  const copy = async () => {
    try {
      setState("loading");

      const stream = networkRequestBodyCache.stream(replayClient, requestSummary.id);
      await stream.resolver;
      const requestBody = stream.value!;

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
