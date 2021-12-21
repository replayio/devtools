import { ResponseBodyData } from "@recordreplay/protocol";
import React, { useState } from "react";
import HttpBody from "./HttpBody";
import { TriangleToggle } from "./RequestDetails";
import { contentType, findHeader, RequestSummary } from "./utils";

const ResponseBody = ({
  request,
  responseBodyParts,
}: {
  request?: RequestSummary;
  responseBodyParts: ResponseBodyData[] | undefined;
}) => {
  const [expanded, setExpanded] = useState(true);

  if (!request || !responseBodyParts) {
    return null;
  }

  return (
    <>
      <div
        className="flex items-center py-1 cursor-pointer font-bold"
        onClick={() => setExpanded(!expanded)}
      >
        <TriangleToggle open={expanded} />
        Response body:
      </div>
      {expanded && (
        <div className="pl-6">
          <HttpBody
            bodyParts={responseBodyParts}
            contentLength={findHeader(request.responseHeaders, "content-length")}
            contentType={contentType(request.responseHeaders)}
          />
        </div>
      )}
    </>
  );
};

export default ResponseBody;
