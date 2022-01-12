import SplitBox from "devtools/packages/devtools-splitter";
import React, { useEffect, useRef, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import {
  getEvents,
  getFormattedFrames,
  getRequests,
  getResponseBodies,
  getRequestBodies,
} from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import RequestDetails from "./RequestDetails";
import RequestTable from "./RequestTable";
import { CanonicalRequestType, RequestSummary } from "./utils";
import FilterBar from "./FilterBar";
import Table from "./Table";
import { fetchFrames, fetchResponseBody, fetchRequestBody } from "ui/actions/network";
import { getThreadContext } from "devtools/client/debugger/src/selectors";

export const NetworkMonitor = ({
  currentTime,
  cx,
  events,
  fetchFrames,
  frames,
  requestBodies,
  requests,
  responseBodies,
  seek,
  selectFrame,
}: PropsFromRedux) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary>();
  const [types, setTypes] = useState<Set<CanonicalRequestType>>(new Set([]));
  const [vert, setVert] = useState<boolean>(false);

  const container = useRef<HTMLDivElement>(null);

  const closePanel = () => setSelectedRequest(undefined);

  const toggleType = (type: CanonicalRequestType) => {
    const newTypes = new Set(types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setTypes(newTypes);
  };

  let resizeObserver = useRef(
    new ResizeObserver(() => setVert((container.current?.offsetWidth || 0) > 700))
  );

  useEffect(() => {
    console.log({ current: container.current?.offsetWidth });
    if (container.current) {
      resizeObserver.current.observe(container.current);
    }
  }, [container.current]);

  return (
    <Table events={events} requests={requests} types={types}>
      {({ table, data }: { table: any; data: RequestSummary[] }) => (
        <div className="flex flex-col min-h-0 h-full" ref={container}>
          <FilterBar types={types} toggleType={toggleType} table={table} />
          <SplitBox
            className="border-t min-h-0"
            initialSize="350"
            minSize={selectedRequest ? "20%" : "100%"}
            maxSize={selectedRequest ? "80%" : "100%"}
            startPanel={
              <RequestTable
                table={table}
                data={data}
                currentTime={currentTime}
                onRowSelect={row => {
                  fetchFrames(row.point);
                  if (row.hasResponseBody) {
                    fetchResponseBody(row.id);
                  }
                  if (row.hasRequestBody) {
                    fetchRequestBody(row.id);
                  }
                  setSelectedRequest(row);
                }}
                seek={seek}
                selectedRequest={selectedRequest}
              />
            }
            endPanel={
              selectedRequest && (
                <RequestDetails
                  closePanel={closePanel}
                  cx={cx}
                  request={selectedRequest}
                  responseBody={responseBodies[selectedRequest.id]}
                  requestBody={requestBodies[selectedRequest.id]}
                  frames={frames[selectedRequest?.point.point]}
                  selectFrame={selectFrame}
                />
              )
            }
            splitterClass="-m-1 bg-clip-padding box-border border-4 z-10"
            splitterSize={1}
            vert={vert}
          />
        </div>
      )}
    </Table>
  );
};

const connector = connect(
  (state: UIState) => ({
    currentTime: getCurrentTime(state),
    cx: getThreadContext(state),
    events: getEvents(state),
    frames: getFormattedFrames(state),
    requestBodies: getRequestBodies(state),
    requests: getRequests(state),
    responseBodies: getResponseBodies(state),
  }),
  {
    fetchFrames: fetchFrames,
    seek: actions.seek,
    selectFrame: actions.selectFrame,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NetworkMonitor);
