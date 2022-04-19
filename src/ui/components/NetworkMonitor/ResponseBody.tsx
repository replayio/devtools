import { ResponseBodyData } from "@recordreplay/protocol";
import React from "react";
import { useSelector } from "react-redux";
import { getSelectedResponseBody } from "ui/reducers/network";

import HttpBody from "./HttpBody";
import { findHeader, RequestSummary } from "./utils";

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

const ResponseBody = ({ request }: { request?: RequestSummary }) => {
  const responseBodyParts = useSelector(getSelectedResponseBody);

  if (!request || !responseBodyParts) {
    return null;
  }

  return <_ResponseBody request={request} responseBodyParts={responseBodyParts} />;
};

export default ResponseBody;
