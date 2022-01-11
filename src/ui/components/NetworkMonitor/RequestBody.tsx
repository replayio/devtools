import { RequestBodyData } from "@recordreplay/protocol";
import React, { useState } from "react";
import HttpBody from "./HttpBody";
import { TriangleToggle } from "./RequestDetails";
import { contentType, findHeader, RequestSummary } from "./utils";

const RequestBody = ({
  request,
  requestBodyParts,
}: {
  request: RequestSummary | undefined;
  requestBodyParts: RequestBodyData[] | undefined;
}) => {
  const [expanded, setExpanded] = useState(true);

  if (!request || !requestBodyParts) {
    return null;
  }

  return (
    <>
      <div
        className="flex items-center py-1 cursor-pointer font-bold"
        onClick={() => setExpanded(!expanded)}
      >
        <TriangleToggle open={expanded} />
        Request body:
      </div>
      {expanded && (
        <div className="pl-6">
          <HttpBody
            bodyParts={requestBodyParts}
            contentLength={findHeader(request.requestHeaders, "content-length")}
            contentType={contentType(request.requestHeaders)}
          />
        </div>
      )}
    </>
  );
};

export default RequestBody;
