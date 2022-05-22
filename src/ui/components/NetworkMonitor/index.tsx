import { getThreadContext } from "devtools/client/debugger/src/selectors";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import React, { useEffect, useRef, useState } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import { actions } from "ui/actions";
import { hideRequestDetails, selectAndFetchRequest } from "ui/actions/network";
import {
  getFocusedEvents,
  getFocusedRequests,
  getSelectedRequestId,
} from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import { timeMixpanelEvent } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

import LoadingProgressBar from "../shared/LoadingProgressBar";

import FilterBar from "./FilterBar";
import RequestDetails from "./RequestDetails";
import RequestTable from "./RequestTable";
import Table from "./Table";
import { CanonicalRequestType, RequestSummary } from "./utils";

export const NetworkMonitor = ({
  currentTime,
  cx,
  events,
  loading,
  requests,
  seek,
}: PropsFromRedux) => {
  const selectedRequestId = useSelector(getSelectedRequestId);
  const [types, setTypes] = useState<Set<CanonicalRequestType>>(new Set([]));
  const [vert, setVert] = useState<boolean>(false);
  const dispatch = useDispatch();

  const container = useRef<HTMLDivElement>(null);

  const toggleType = (type: CanonicalRequestType) => {
    dispatch(hideRequestDetails());

    const newTypes = new Set(types);
    if (newTypes.has(type)) {
      trackEvent("net_monitor.delete_type", { type });
      newTypes.delete(type);
    } else {
      trackEvent("net_monitor.add_type", { type });
      newTypes.add(type);
    }
    setTypes(newTypes);
  };

  let resizeObserver = useRef(
    new ResizeObserver(() => setVert((container.current?.offsetWidth || 0) > 700))
  );

  useEffect(() => {
    if (container.current) {
      resizeObserver.current.observe(container.current);
    }
  });

  if (loading) {
    timeMixpanelEvent("net_monitor.open_network_monitor");
    return (
      <div className="relative">
        <LoadingProgressBar />
      </div>
    );
  }

  trackEvent("net_monitor.open_network_monitor");

  return (
    <Table events={events} requests={requests} types={types}>
      {({ table, data }: { table: any; data: RequestSummary[] }) => {
        let selectedRequest;
        if (selectedRequestId) {
          selectedRequest = data.find(request => request.id === selectedRequestId);
        }

        return (
          <div className="flex h-full min-h-0 flex-col" ref={container}>
            <FilterBar types={types} toggleType={toggleType} table={table} />
            <SplitBox
              className="min-h-0 border-t border-splitter"
              initialSize="350px"
              minSize={selectedRequest ? "30%" : "100%"}
              maxSize={selectedRequest ? "70%" : "100%"}
              startPanel={
                <RequestTable
                  table={table}
                  data={data}
                  currentTime={currentTime}
                  onRowSelect={row => {
                    trackEvent("net_monitor.select_request_row");
                    dispatch(selectAndFetchRequest(row.id));
                  }}
                  seek={seek}
                  selectedRequest={selectedRequest}
                />
              }
              endPanel={
                selectedRequest ? <RequestDetails cx={cx} request={selectedRequest} /> : null
              }
              splitterSize={2}
              vert={vert}
            />
          </div>
        );
      }}
    </Table>
  );
};

const connector = connect(
  (state: UIState) => ({
    currentTime: getCurrentTime(state),
    cx: getThreadContext(state),
    events: getFocusedEvents(state),
    loading: state.network.loading,
    requests: getFocusedRequests(state),
  }),
  {
    seek: actions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NetworkMonitor);
