import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getEvents, getRequests } from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import RequestDetails from "./RequestDetails";
import RequestTable from "./RequestTable";
import { RequestSummary } from "./utils";

export const NetworkMonitor = ({ seek, requests, events, currentTime }: PropsFromRedux) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary>();

  return (
    <SplitBox
      className="max-h-full"
      initialSize="50%"
      minSize={selectedRequest ? "20%" : "100%"}
      maxSize={selectedRequest ? "80%" : "100%"}
      endPanel={selectedRequest ? <RequestDetails request={selectedRequest} /> : <div />}
      startPanel={
        <RequestTable
          currentTime={currentTime}
          events={events}
          onClick={setSelectedRequest}
          requests={requests}
          seek={seek}
          selectedRequest={selectedRequest}
        />
      }
      vert={true}
      splitterSize={8}
    />
  );
};

const connector = connect(
  (state: UIState) => ({
    events: getEvents(state),
    requests: getRequests(state),
    currentTime: getCurrentTime(state),
  }),
  { seek: actions.seek }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NetworkMonitor);
