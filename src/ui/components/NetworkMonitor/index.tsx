import { useContext, useDeferredValue, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useStreamingValue } from "suspense";

import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { replayClient } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { hideRequestDetails, selectNetworkRequest } from "ui/actions/network";
import { seek } from "ui/actions/timeline";
import { NetworkMonitorList } from "ui/components/NetworkMonitor/NetworkMonitorList";
import RequestDetails from "ui/components/NetworkMonitor/RequestDetails";
import { TextFilterRow } from "ui/components/NetworkMonitor/TextFilterRow";
import { TypeFiltersColumn } from "ui/components/NetworkMonitor/TypeFiltersColumn";
import { getSelectedRequestId } from "ui/reducers/network";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { timeMixpanelEvent } from "ui/utils/mixpanel";
import { trackEvent } from "ui/utils/telemetry";

import { CanonicalRequestType, RequestSummary, partialRequestsToCompleteSummaries } from "./utils";

export default function NetworkMonitor() {
  const dispatch = useAppDispatch();

  const [filterByText, setFilterByText] = useState<string>("");
  const deferredFilterByText = useDeferredValue(filterByText);

  const currentTime = useAppSelector(getCurrentTime);
  const { range: focusWindow } = useContext(FocusContext);

  const selectedRequestId = useAppSelector(getSelectedRequestId);
  const [types, setTypes] = useState<Set<CanonicalRequestType>>(new Set([]));
  const [showTypeFilters, setShowTypeFilters] = useState(false);

  const container = useRef<HTMLDivElement>(null);

  const stream = networkRequestsCache.stream(replayClient);
  const { complete, data: records = {}, value: ids = [] } = useStreamingValue(stream);

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

  const requests = useMemo(
    () => partialRequestsToCompleteSummaries(ids, records, types),
    [ids, records, types]
  );

  const { countAfter, countBefore, filteredRequests } = useMemo(() => {
    if (focusWindow === null) {
      return {
        countAfter: 0,
        countBefore: 0,
        filteredRequests: [],
      };
    }

    const filteredRequests: RequestSummary[] = [];

    let countBefore = 0;
    let countAfter = 0;

    for (const request of requests) {
      const point = request.point.point;

      let match = true;
      if (deferredFilterByText !== "") {
        const searchText = deferredFilterByText.toLowerCase();

        const { cause, documentType, method, name, status, url } = request;
        let type = documentType || cause || "";
        if (type === "unknown") {
          type = "";
        }
        match =
          [method, name, `${status}`, type, url].find(string =>
            string.toLowerCase().includes(searchText)
          ) != null;
      }

      if (match) {
        if (isExecutionPointsLessThan(point, focusWindow.begin.point)) {
          countBefore++;
        } else if (isExecutionPointsGreaterThan(point, focusWindow.end.point)) {
          countAfter++;
        } else {
          filteredRequests.push(request);
        }
      }
    }

    return {
      countAfter,
      countBefore,
      deferredFilterByText,
      filteredRequests,
    };
  }, [deferredFilterByText, focusWindow, requests]);

  const [, dismissInspectNetworkRequestNag] = useNag(Nag.INSPECT_NETWORK_REQUEST);

  if (!complete) {
    timeMixpanelEvent("net_monitor.open_network_monitor");
    return <IndeterminateLoader />;
  }

  trackEvent("net_monitor.open_network_monitor");

  return (
    <div className="flex h-full min-h-0 flex-col" ref={container}>
      <TextFilterRow
        filterByText={filterByText}
        setFilterByText={setFilterByText}
        setShowTypeFilters={setShowTypeFilters}
        showTypeFilters={showTypeFilters}
        types={types}
      />

      <div className="flex h-full w-full flex-row">
        {showTypeFilters && <TypeFiltersColumn toggleType={toggleType} types={types} />}
        <PanelGroup autoSaveId="NetworkMonitor" className="h-full shrink grow" direction="vertical">
          <Panel>
            <NetworkMonitorList
              currentTime={currentTime}
              filteredAfterCount={countAfter}
              filteredBeforeCount={countBefore}
              requests={filteredRequests}
              seekToRequest={request => {
                trackEvent("net_monitor.seek_to_request");
                dispatch(
                  seek({
                    executionPoint: request.point.point,
                    openSource: true,
                    time: request.point.time,
                  })
                );

                dismissInspectNetworkRequestNag();

                trackEvent("net_monitor.select_request_row");
                dispatch(selectNetworkRequest(request.id));
              }}
              selectedRequestId={selectedRequestId}
              selectRequest={request => {
                dismissInspectNetworkRequestNag();

                trackEvent("net_monitor.select_request_row");
                dispatch(selectNetworkRequest(request ? request.id : null));
              }}
            />
          </Panel>
          {selectedRequestId && (
            <>
              <PanelResizeHandle className="h-1 w-full" />
              <Panel defaultSize={50}>
                {selectedRequestId ? (
                  <RequestDetails requests={requests} selectedRequestId={selectedRequestId} />
                ) : (
                  <div>Loading…</div>
                )}
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
