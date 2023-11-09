import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { useNetworkResponseBody } from "replay-next/src/hooks/useNetworkResponseBody";

import HttpBody from "./HttpBody";
import { RequestSummary, findHeader } from "./utils";

export default function ResponseBodyWrapper({ request }: { request: RequestSummary | undefined }) {
  if (!request || !request.hasResponseBody) {
    return null;
  }

  return <ResponseBody request={request} />;
}

function ResponseBody({ request }: { request: RequestSummary }) {
  const responseBody = useNetworkResponseBody(request.id);
  if (!responseBody) {
    return <LoadingProgressBar />;
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 font-bold">Response body:</div>
      <div className="pl-4">
        <HttpBody
          bodyParts={responseBody}
          contentType={findHeader(request.responseHeaders, "content-type") || "unknown"}
          filename={request.name}
        />
      </div>
    </>
  );
}
