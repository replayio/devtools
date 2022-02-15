import { RequestBodyData } from "@recordreplay/protocol";
import React, { useState } from "react";
import HttpBody from "./HttpBody";
import { contentType, findHeader, RequestSummary } from "./utils";

const RequestBody = ({
  request,
  requestBodyParts,
}: {
  request: RequestSummary | undefined;
  requestBodyParts: RequestBodyData[] | undefined;
}) => {
  if (!request || !requestBodyParts) {
    return null;
  }

  return (
    <>
      <div className="flex items-center py-2 pl-4 font-bold">Request body:</div>
      <div className="pl-6">
        <HttpBody
          bodyParts={requestBodyParts}
          contentType={findHeader(request.responseHeaders, "content-type") || "unknown"}
          filename={request.name}
        />
      </div>
    </>
  );
};

export default RequestBody;
