import React from "react";
import { useAppSelector } from "ui/setup/hooks";
import { getSelectedRequestBody } from "ui/reducers/network";
import HttpBody from "./HttpBody";
import { findHeader, RequestSummary } from "./utils";

const RequestBody = ({ request }: { request: RequestSummary | undefined }) => {
  const requestBody = useAppSelector(getSelectedRequestBody);

  if (!request || !requestBody) {
    return null;
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
};

export default RequestBody;
