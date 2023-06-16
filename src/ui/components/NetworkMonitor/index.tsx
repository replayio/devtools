import { RequestId } from "@replayio/protocol";
import { useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useStreamingValue } from "suspense";

import { getThreadContext } from "devtools/client/debugger/src/selectors";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { replayClient } from "shared/client/ReplayClientContext";
import { hideRequestDetails, selectNetworkRequest } from "ui/actions/network";
import { seek } from "ui/actions/timeline";
import { FilterLayout } from "ui/components/NetworkMonitor/FilterLayout";
import RequestDetails from "ui/components/NetworkMonitor/RequestDetails";
import RequestTable from "ui/components/NetworkMonitor/RequestTable";
import Table from "ui/components/NetworkMonitor/Table";
import { getSelectedRequestId } from "ui/reducers/network";
import { getCurrentTime, getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { timeMixpanelEvent } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

import { CanonicalRequestType, RequestSummary } from "./utils";

export default function NetworkMonitor() {
  const dispatch = useAppDispatch();

  const currentTime = useAppSelector(getCurrentTime);
  const context = useAppSelector(getThreadContext);
  const focusWindow = useAppSelector(getFocusWindow);

  const selectedRequestId = useAppSelector(getSelectedRequestId);
  const [types, setTypes] = useState<Set<CanonicalRequestType>>(new Set([]));

  const container = useRef<HTMLDivElement>(null);

  const stream = networkRequestsCache.stream(replayClient);
  const { complete, data: records = {}, value: ids = [] } = useStreamingValue(stream);

  const { countAfter, countBefore, filteredIds } = useMemo(() => {
    if (focusWindow === null) {
      return {
        countAfter: 0,
        countBefore: 0,
        filteredIds: ids,
      };
    }

    const filteredIds: RequestId[] = [];

    let countBefore = 0;
    let countAfter = 0;

    if (records != null) {
      for (const id of ids) {
        const record = records[id];
        const point = record.timeStampedPoint.point;

        if (isExecutionPointsLessThan(point, focusWindow.begin.point)) {
          countBefore++;
        } else if (isExecutionPointsGreaterThan(point, focusWindow.end.point)) {
          countAfter++;
        } else {
          filteredIds.push(id);
        }
      }
    }

    return {
      countAfter,
      countBefore,
      filteredIds,
    };
  }, [focusWindow, ids, records]);

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

  if (!complete) {
    timeMixpanelEvent("net_monitor.open_network_monitor");
    return <IndeterminateLoader />;
  }

  trackEvent("net_monitor.open_network_monitor");

  return (
    <Table ids={filteredIds} records={records} types={types}>
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
                <PanelGroup
                  autoSaveId="NetworkMonitor"
                  className="h-full w-full"
                  direction="vertical"
                >
                  <Panel>
                    <RequestTable
                      className="h-full w-full"
                      table={table}
                      currentTime={currentTime}
                      data={data}
                      filteredAfterCount={countAfter}
                      filteredBeforeCount={countBefore}
                      onRowSelect={row => {
                        trackEvent("net_monitor.select_request_row");
                        dispatch(selectNetworkRequest(row.id));
                      }}
                      seek={(...args) => dispatch(seek(...args))}
                      selectedRequest={selectedRequest}
                    />
                  </Panel>
                  {selectedRequestId && (
                    <>
                      <PanelResizeHandle className="h-2 w-full" />
                      <Panel defaultSize={50}>
                        {selectedRequest ? (
                          <RequestDetails
                            cx={context}
                            request={selectedRequest}
                            previousRequestId={previousRequestId}
                            nextRequestId={nextRequestId}
                          />
                        ) : (
                          <div>Loading…</div>
                        )}
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              }
            />
          </div>
        );
      }}
    </Table>
  );
}
