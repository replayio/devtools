import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getEvents, getRequests } from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import RequestDetails from "./RequestDetails";
import RequestTable from "./RequestTable";
import { RequestSummary, RequestType } from "./utils";
import FilterBar from "./FilterBar";
import Table from "./Table";

export const NetworkMonitor = ({ seek, requests, events, currentTime }: PropsFromRedux) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary>();
  const [types, setTypes] = useState<Set<RequestType>>(new Set(["json"]));

  const toggleType = (type: RequestType) => {
    if (types.has(type)) {
      types.delete(type);
    } else {
      types.add(type);
    }
    setTypes(new Set(types));
  };

  return (
    <div className="overflow-hidden h-full">
      <Table events={events} requests={requests} types={types}>
        {({ table, data }: { table: any; data: RequestSummary[] }) => (
          <>
            <FilterBar types={types} toggleType={toggleType} table={table} />
            <SplitBox
              className="max-h-full"
              initialSize="50%"
              minSize={selectedRequest ? "20%" : "100%"}
              maxSize={selectedRequest ? "80%" : "100%"}
              endPanel={selectedRequest ? <RequestDetails request={selectedRequest} /> : <div />}
              startPanel={
                <RequestTable
                  table={table}
                  data={data}
                  currentTime={currentTime}
                  onRowSelect={setSelectedRequest}
                  seek={seek}
                  selectedRequest={selectedRequest}
                />
              }
              vert={true}
              splitterSize={2}
            />
          </>
        )}
      </Table>
    </div>
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
