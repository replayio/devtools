import React from "react";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { RequestSummary } from "./utils";
import { Row } from "react-table";

export const RequestRow = ({
  currentTime,
  isFirstInFuture,
  isInPast,
  onClick,
  onSeek,
  prepareRow,
  row,
}: {
  currentTime: number;
  isFirstInFuture: boolean;
  isInPast: boolean;
  onClick: (row: RequestSummary) => void;
  onSeek: (row: RequestSummary) => void;
  prepareRow: (row: Row<RequestSummary>) => void;
  row: Row<RequestSummary>;
}) => {
  let currentRow = false;
  // Did we just pass the row boundary that contains the current time?
  // If so, let's render this row as the "current" row and all rows
  // after it as future rows.
  // if (
  //   selectedRequest?.id === row.original.id ||
  //   (!selectedRequest && renderingRequestsInThePast && currentTime <= row.original.point.time)
  // ) {
  //   renderingRequestsInThePast = false;
  //   currentRow = true;
  // }
  prepareRow(row);
  return (
    <div
      className={classNames(styles.row, {
        [styles.current]: isFirstInFuture,
        "text-lightGrey": !isInPast,
      })}
      onClick={() => onClick(row.original)}
      key={row.getRowProps().key}
    >
      <div {...row.getRowProps()}>
        {row.original.triggerPoint && row.original.triggerPoint.time !== currentTime && (
          <div
            className={classNames(styles.seekBadge)}
            onClick={() => {
              if (!row.original.triggerPoint) {
                return;
              }
              onSeek(row.original);
            }}
          >
            <div
              className={classNames("img", {
                [styles.fastForward]: row.original.triggerPoint.time > currentTime,
                [styles.rewind]: row.original.triggerPoint.time < currentTime,
              })}
            />
            <span className={classNames("px-2 text-white", styles.verbose)}>
              {row.original.triggerPoint.time > currentTime ? "Fast-forward" : "Rewind"}
            </span>
          </div>
        )}
        {row.cells.map(cell => {
          return (
            <div
              className={classNames(
                "whitespace-nowrap p-1 items-center overflow-hidden",
                styles[cell.column.id]
              )}
              {...cell.getCellProps()}
              style={{ ...cell.getCellProps().style, display: "flex" }}
            >
              <div className={(cell.column as any).className}>{cell.render("Cell")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
