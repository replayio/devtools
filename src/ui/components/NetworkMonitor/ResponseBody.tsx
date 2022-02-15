import { ResponseBodyData } from "@recordreplay/protocol";
import React from "react";
import HttpBody from "./HttpBody";
import { contentType, findHeader, RequestSummary } from "./utils";

const ResponseBody = ({
  request,
  responseBodyParts,
}: {
  request?: RequestSummary;
  responseBodyParts: ResponseBodyData[] | undefined;
}) => {
  if (!request || !responseBodyParts) {
    return null;
  }
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
};

export default ResponseBody;
