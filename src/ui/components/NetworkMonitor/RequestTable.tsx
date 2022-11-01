import classNames from "classnames";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Row, TableInstance } from "react-table";
import { setFocusRegionEndTime, setFocusRegionBeginTime } from "ui/actions/timeline";
import type { AppDispatch } from "ui/setup/store";
import { trackEvent } from "ui/utils/telemetry";

import { ContextMenu } from "../ContextMenu";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import Icon from "../shared/Icon";

import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import styles from "./RequestTable.module.css";
import { RequestSummary } from "./utils";
import { getLoadedRegions } from "ui/reducers/app";
import { isTimeInRegions } from "ui/utils/timeline";

interface ContextMenuData {
  pageX: number;
  pageY: number;
  row: Row<RequestSummary>;
}

const RequestTable = ({
  className,
  currentTime,
  data,
  filteredAfterCount,
  filteredBeforeCount,
  onRowSelect,
  seek,
  selectedRequest,
  table,
}: {
  className?: string;
  currentTime: number;
  data: RequestSummary[];
  filteredAfterCount: number;
  filteredBeforeCount: number;
  onRowSelect: (request: RequestSummary) => void;
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { columns, getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const dispatch = useAppDispatch() as AppDispatch;
  const loadedRegions = useAppSelector(getLoadedRegions);
  const [contextMenuData, setContextMenuData] = useState<ContextMenuData | null>(null);

  const onSeek = (request: RequestSummary) => {
    trackEvent("net_monitor.seek_to_request");
    seek(request.point.point, request.point.time, true);
    onRowSelect(request);
  };

  const closeContextMenu = () => {
    setContextMenuData(null);
  };

  const setFocusEnd = () => {
    setContextMenuData(null);

    if (contextMenuData) {
      const endTime = contextMenuData.row.original?.end;
      if (endTime != null) {
        dispatch(setFocusRegionEndTime(endTime, true));
      }
    }
  };

  const setFocusStart = () => {
    setContextMenuData(null);

    if (contextMenuData) {
      const beginTime = contextMenuData.row.original?.start;
      if (beginTime != null) {
        dispatch(setFocusRegionBeginTime(beginTime, true));
      }
    }
  };

  let inPast = true;

  return (
    <div className={classNames("no-scrollbar min-w-full bg-bodyBgcolor", className)}>
      {/* Relative here helps with when the timeline goes past the last request*/}
      <div
        className={classNames("flex h-full w-full flex-col overflow-x-auto", styles.request)}
        {...getTableProps()}
      >
        <HeaderGroups columns={columns as any} headerGroups={headerGroups} />

        <div className="relative w-fit min-w-full overflow-y-auto" {...getTableBodyProps()}>
          {filteredBeforeCount > 0 && (
            <div className={styles.banner}>{filteredBeforeCount} requests filtered before</div>
          )}

          {rows.map((row: Row<RequestSummary>) => {
            let firstInFuture = false;
            if (inPast && row.original.point.time >= currentTime) {
              inPast = false;
              firstInFuture = true;
            }

            const isInLoadedRegion = loadedRegions
              ? isTimeInRegions(row.original.point.time, loadedRegions.loaded)
              : false;

            prepareRow(row);

            return (
              <RequestRow
                currentTime={currentTime}
                isFirstInFuture={firstInFuture}
                isInLoadedRegion={isInLoadedRegion}
                isInPast={inPast}
                isSelected={selectedRequest?.id === row.original.id}
                key={row.getRowProps().key}
                onClick={onRowSelect}
                onSeek={onSeek}
                row={row}
                showContentMenuAt={setContextMenuData}
              />
            );
          })}
          <div
            className={classNames({
              [styles.current]: data.every(r => (r.point?.time || 0) < currentTime),
              [styles.end]: data.every(r => (r.point?.time || 0) < currentTime),
            })}
          />

          {filteredAfterCount > 0 && (
            <div className={styles.banner}>{filteredAfterCount} requests filtered after</div>
          )}
        </div>
      </div>

      {contextMenuData !== null && (
        <ContextMenu x={contextMenuData.pageX} y={contextMenuData.pageY} close={closeContextMenu}>
          <Dropdown>
            <DropdownItem onClick={setFocusStart}>
              <>
                <Icon filename="set-focus-start" className="mr-4 bg-iconColor" size="large" />
                Set focus start
              </>
            </DropdownItem>
            <DropdownItem onClick={setFocusEnd}>
              <>
                <Icon filename="set-focus-end" className="mr-4 bg-iconColor" size="large" />
                Set focus end
              </>
            </DropdownItem>
          </Dropdown>
        </ContextMenu>
      )}
    </div>
  );
};

export default RequestTable;
