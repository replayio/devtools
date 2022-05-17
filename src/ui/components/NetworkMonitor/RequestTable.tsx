import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion, syncFocusedRegion } from "ui/actions/timeline";
import { getLoadedRegions } from "ui/reducers/app";
import { getFocusRegion } from "ui/reducers/timeline";
import { isTimeInRegions } from "ui/utils/timeline";

import { ContextMenu } from "../ContextMenu";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import Icon from "../shared/Icon";

import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { RequestSummary } from "./utils";
import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import { Row, TableInstance } from "react-table";
import { trackEvent } from "ui/utils/telemetry";

interface ContextMenuData {
  pageX: number;
  pageY: number;
  row: Row<RequestSummary>;
}

const RequestTable = ({
  className,
  currentTime,
  data,
  onRowSelect,
  seek,
  selectedRequest,
  table,
}: {
  className?: string;
  currentTime: number;
  data: RequestSummary[];
  onRowSelect: (request: RequestSummary) => void;
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { columns, getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const dispatch = useDispatch();
  const loadedRegions = useSelector(getLoadedRegions);
  const focusRegion = useSelector(getFocusRegion);
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
      const time = contextMenuData.row.original?.end;
      if (time != null) {
        // If this is the first time the user is focusing, start at the beginning of the recording (or zoom region).
        // Let the focus action/reducer will handle cropping for us.
        const startTime = focusRegion ? focusRegion.startTime : 0;
        const endTime = time;

        dispatch(
          setFocusRegion({
            endTime,
            startTime,
          })
        );
        dispatch(syncFocusedRegion());
      }
    }
  };

  const setFocusStart = () => {
    setContextMenuData(null);

    if (contextMenuData) {
      const time = contextMenuData.row.original?.start;
      if (time != null) {
        // If this is the first time the user is focusing, extend to the end of the recording (or zoom region).
        // Let the focus action/reducer will handle cropping for us.
        const startTime = time!;
        const endTime = focusRegion ? focusRegion.endTime : Number.POSITIVE_INFINITY;

        dispatch(
          setFocusRegion({
            endTime,
            startTime,
          })
        );
        dispatch(syncFocusedRegion());
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
        <HeaderGroups columns={columns} headerGroups={headerGroups} />
        <div className="w-fit min-w-full overflow-y-auto" {...getTableBodyProps()}>
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
        </div>
      </div>

      {contextMenuData !== null && (
        <ContextMenu x={contextMenuData.pageX} y={contextMenuData.pageY} close={closeContextMenu}>
          <Dropdown>
            <DropdownItem onClick={setFocusStart}>
              <>
                <Icon filename="set-focus-start" className="mr-4 bg-iconColor" />
                Set focus start
              </>
            </DropdownItem>
            <DropdownItem onClick={setFocusEnd}>
              <>
                <Icon filename="set-focus-end" className="mr-4 bg-iconColor" />
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
