import SplitBox from "devtools/packages/devtools-splitter";
import React, { useEffect, useRef, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getEvents, getFormattedFrames, getRequests } from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import RequestDetails from "./RequestDetails";
import RequestTable from "./RequestTable";
import { RequestSummary, RequestType } from "./utils";
import FilterBar from "./FilterBar";
import Table from "./Table";
import { fetchFrames } from "ui/actions/network";
import { getThreadContext } from "devtools/client/debugger/src/selectors";

export const NetworkMonitor = ({
  currentTime,
  cx,
  events,
  fetchFrames,
  frames,
  requests,
  seek,
  selectFrame,
}: PropsFromRedux) => {
  const [selectedRequest, setSelectedRequest] = useState<RequestSummary>();
  const [types, setTypes] = useState<Set<RequestType>>(new Set(["xhr"]));
  const [vert, setVert] = useState<boolean>(false);

  const container = useRef<HTMLDivElement>(null);

  const closePanel = () => setSelectedRequest(undefined);

  const toggleType = (type: RequestType) => {
    if (types.has(type)) {
      types.delete(type);
    } else {
      types.add(type);
    }
    setTypes(new Set(types));
  };

  let resizeObserver = useRef(
    new ResizeObserver(() => setVert((container.current?.offsetWidth || 0) > 700))
  );

  useEffect(() => {
    if (container.current) {
      resizeObserver.current.observe(container.current);
    }
  }, [container.current]);

  return (
    <div className="overflow-hidden h-full" ref={container}>
      <Table events={events} requests={requests} types={types}>
        {({ table, data }: { table: any; data: RequestSummary[] }) => (
          <>
            <FilterBar types={types} toggleType={toggleType} table={table} />
            <SplitBox
              className="max-h-full"
              initialSize="50%"
              minSize={selectedRequest ? "20%" : "100%"}
              maxSize={selectedRequest ? "80%" : "100%"}
              endPanel={
                selectedRequest ? (
                  <RequestDetails
                    closePanel={closePanel}
                    cx={cx}
                    request={selectedRequest}
                    frames={frames[selectedRequest?.point.point]}
                    selectFrame={selectFrame}
                  />
                ) : (
                  <div />
                )
              }
              startPanel={
                <RequestTable
                  table={table}
                  data={data}
                  currentTime={currentTime}
                  onRowSelect={row => {
                    fetchFrames(row.point);
                    setSelectedRequest(row);
                  }}
                  seek={seek}
                  selectedRequest={selectedRequest}
                />
              }
              vert={vert}
              splitterSize={4}
            />
          </>
        )}
      </Table>
    </div>
  );
};

const connector = connect(
  (state: UIState) => ({
    currentTime: getCurrentTime(state),
    cx: getThreadContext(state),
    events: getEvents(state),
    frames: getFormattedFrames(state),
    requests: getRequests(state),
  }),
  {
    fetchFrames: fetchFrames,
    seek: actions.seek,
    selectFrame: actions.selectFrame,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NetworkMonitor);
