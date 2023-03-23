import classNames from "classnames";
import { Row, TableInstance } from "react-table";

import { getLoadedRegions } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import { isTimeInRegions } from "ui/utils/timeline";

import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import useCopyToCliboard from "./useCopyToClipboard";
import { RequestSummary } from "./utils";
import styles from "./RequestTable.module.css";

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
  seek: (point: string, time: number, openSource: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { columns, getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const loadedRegions = useAppSelector(getLoadedRegions);
  const { shouldShowLoading, isCopied, onClipboardCopy } = useCopyToCliboard();

  const onSeek = (request: RequestSummary) => {
    trackEvent("net_monitor.seek_to_request");
    seek(request.point.point, request.point.time, true);
    onRowSelect(request);
  };

  let inPast = true;

  return (
    <div className={classNames("no-scrollbar min-w-full bg-bodyBgcolor", className)}>
      {/* Relative here helps with when the timeline goes past the last request*/}
      <div
        className={classNames("flex h-full w-full flex-col overflow-x-auto", styles.request)}
        {...getTableProps()}
      >
        {isCopied || shouldShowLoading ? (
          <div className="absolute z-50 grid h-56 grid-cols-1 content-end place-self-center">
            <div
              id="showCopied"
              className={`mb-1.5 flex shrink rounded-lg bg-black p-1.5 text-center text-white opacity-100 shadow-2xl transition-all duration-700 ease-in-out`}
            >
              {`${shouldShowLoading ? "Copying" : "Copied"} to clipboard`}
            </div>
          </div>
        ) : null}

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
                onClipboardCopy={onClipboardCopy}
                row={row}
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
    </div>
  );
};

export default RequestTable;
