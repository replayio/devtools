import classNames from "classnames";
import React from "react";
import { Row } from "react-table";

import styles from "./RequestTable.module.css";
import { RequestSummary } from "./utils";

export const RequestRow = ({
  currentTime,
  isFirstInFuture,
  isInPast,
  isSelected,
  onClick,
  onSeek,
  row,
}: {
  currentTime: number;
  isFirstInFuture: boolean;
  isInPast: boolean;
  isSelected: boolean;
  onClick: (row: RequestSummary) => void;
  onSeek: (row: RequestSummary) => void;
  row: Row<RequestSummary>;
}) => {
  return (
    <div
      className={classNames(styles.row, {
        [styles.current]: isFirstInFuture,
        [styles.selected]: isSelected,
        "text-lightGrey": !isInPast,
      })}
      onClick={() => onClick(row.original)}
      key={row.getRowProps().key}
    >
      <div {...row.getRowProps()}>
        {row.original.triggerPoint && row.original.triggerPoint.time !== currentTime && (
          <div
            className={classNames(styles.seekBadge, "shadow-md")}
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
          const { key, ...cellProps } = cell.getCellProps();
          return (
            <div
              key={key}
              className={classNames(
                "items-center overflow-hidden whitespace-nowrap p-1",
                styles[cell.column.id]
              )}
              {...cellProps}
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
