import { ResponseBodyData } from "@replayio/protocol";

import { useNetworkResponseBody } from "replay-next/src/hooks/useNetworkResponseBody";

import LoadingProgressBar from "../shared/LoadingProgressBar";
import HttpBody from "./HttpBody";
import { RequestSummary, findHeader } from "./utils";

// Keep the internal implementation separate so we can mock it easily in storybook.
export function _ResponseBody({
  request,
  responseBodyParts,
}: {
  request: RequestSummary;
  responseBodyParts: ResponseBodyData[];
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 font-bold">Response body:</div>
      <div className="pl-4">
        <HttpBody
          bodyParts={responseBodyParts}
          contentType={findHeader(request.responseHeaders, "content-type") || "unknown"}
          filename={request.name}
        />
      </div>
    </>
  );
}

function ResponseBody({ request }: { request: RequestSummary }) {
  const responseBody = useNetworkResponseBody(request.id);
  if (!responseBody) {
    return <LoadingProgressBar />;
  }

  return <_ResponseBody request={request} responseBodyParts={responseBody} />;
}

export default ResponseBody;
