import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { useNetworkRequestBody } from "replay-next/src/hooks/useNetworkRequestBody";

import HttpBody from "./HttpBody";
import { RequestSummary, findHeader } from "./utils";

export default function RequestBodyWrapper({ request }: { request: RequestSummary | undefined }) {
  if (!request || !request.hasRequestBody) {
    return null;
  }

  return <RequestBody request={request} />;
}

function RequestBody({ request }: { request: RequestSummary }) {
  const requestBody = useNetworkRequestBody(request.id);
  if (!requestBody) {
    return <LoadingProgressBar />;
  }

  return (
    <>
      <div className="flex items-center py-2 pl-4 font-bold">Request body:</div>
      <div className="pl-6">
        <HttpBody
          bodyParts={requestBody}
          contentType={findHeader(request.requestHeaders, "content-type") || "unknown"}
          filename={request.name}
        />
      </div>
    </>
  );
}
