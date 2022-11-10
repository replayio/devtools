import React, { useEffect, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import IndeterminateLoader from "bvaughn-architecture-demo/components/IndeterminateLoader";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { actions } from "ui/actions";
import { hideRequestDetails, selectAndFetchRequest } from "ui/actions/network";
import { getFocusedEvents, getFocusedRequests, getSelectedRequestId } from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { timeMixpanelEvent } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

import LoadingProgressBar from "../shared/LoadingProgressBar";
import { FilterLayout } from "./FilterLayout";
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
  requestsAfterFilterCount,
  requestsBeforeFilterCount,
  seek,
}: PropsFromRedux) => {
  const selectedRequestId = useAppSelector(getSelectedRequestId);
  const dispatch = useAppDispatch();
  const [types, setTypes] = useState<Set<CanonicalRequestType>>(new Set([]));
  const [vert, setVert] = useState<boolean>(false);

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
    const observer = resizeObserver.current;
    const splitBoxContainer = container.current;

    if (splitBoxContainer) {
      observer.observe(splitBoxContainer);
    }

    return () => {
      if (splitBoxContainer) {
        observer.unobserve(splitBoxContainer);
      }
    };
  }, []);

  if (loading) {
    timeMixpanelEvent("net_monitor.open_network_monitor");
    return <IndeterminateLoader />;
  }

  trackEvent("net_monitor.open_network_monitor");

  return (
    <Table events={events} requests={requests} types={types}>
      {({ table, data }: { table: any; data: RequestSummary[] }) => {
        let selectedRequest;
        let previousRequestId = null;
        let nextRequestId = null;
        if (selectedRequestId) {
          selectedRequest = data.find((request, i) => {
            if (request.id === selectedRequestId) {
              previousRequestId = i > 0 ? data[i - 1].id : null;
              nextRequestId = i + 1 < data.length ? data[i + 1].id : null;
              return true;
            }
          });
        }

        return (
          <div className="flex h-full min-h-0 flex-col" ref={container}>
            <FilterLayout
              setFilterValue={table.setGlobalFilter}
              toggleType={toggleType}
              types={types}
              table={
                <SplitBox
                  className="min-h-0 border-t border-splitter"
                  initialSize="350px"
                  minSize={selectedRequest ? "30%" : "100%"}
                  maxSize={selectedRequest ? "70%" : "100%"}
                  startPanel={
                    <RequestTable
                      table={table}
                      currentTime={currentTime}
                      data={data}
                      filteredAfterCount={requestsAfterFilterCount}
                      filteredBeforeCount={requestsBeforeFilterCount}
                      onRowSelect={row => {
                        trackEvent("net_monitor.select_request_row");
                        dispatch(selectAndFetchRequest(row.id));
                      }}
                      seek={seek}
                      selectedRequest={selectedRequest}
                    />
                  }
                  endPanel={
                    selectedRequestId ? (
                      selectedRequest ? (
                        <RequestDetails
                          cx={cx}
                          request={selectedRequest}
                          previousRequestId={previousRequestId}
                          nextRequestId={nextRequestId}
                        />
                      ) : (
                        <div>Loading…</div>
                      )
                    ) : null
                  }
                  splitterSize={2}
                  vert={vert}
                />
              }
            />
          </div>
        );
      }}
    </Table>
  );
};

const connector = connect(
  (state: UIState) => {
    const [requests, requestsBeforeFilterCount, requestsAfterFilterCount] =
      getFocusedRequests(state);

    return {
      currentTime: getCurrentTime(state),
      cx: getThreadContext(state),
      events: getFocusedEvents(state),
      loading: state.network.loading,
      requests,
      requestsAfterFilterCount,
      requestsBeforeFilterCount,
    };
  },
  {
    seek: actions.seek,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NetworkMonitor);
