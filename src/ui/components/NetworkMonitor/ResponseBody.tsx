import React from "react";
import { useSelector } from "react-redux";
import { getSelectedResponseBody } from "ui/reducers/network";
import HttpBody from "./HttpBody";
import { findHeader, RequestSummary } from "./utils";

const ResponseBody = ({ request }: { request?: RequestSummary }) => {
  const responseBody = useSelector(getSelectedResponseBody);

  if (!request || !responseBody) {
    return null;
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
};

export default ResponseBody;
