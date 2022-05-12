import React, { useLayoutEffect, useRef } from "react";

import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { RequestSummary } from "./utils";
import { Row } from "react-table";

export const RequestRow = ({
  currentTime,
  isFirstInFuture,
  isInLoadedRegion,
  isInPast,
  isSelected,
  onClick,
  onSeek,
  row,
}: {
  currentTime: number;
  isFirstInFuture: boolean;
  isInLoadedRegion: boolean;
  isInPast: boolean;
  isSelected: boolean;
  onClick: (row: RequestSummary) => void;
  onSeek: (row: RequestSummary) => void;
  row: Row<RequestSummary>;
}) => {
  const prevIsSelectedRef = useRef<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  // Make sure newly selected Network requests have been scrolled into view.
  useLayoutEffect(() => {
    if (isSelected && !prevIsSelectedRef.current) {
      ref.current!.scrollIntoView({ block: "nearest" });
    }

    prevIsSelectedRef.current = isSelected;
  }, [isSelected]);

  return (
    <div
      key={row.getRowProps().key}
      className={classNames(styles.row, {
        [styles.current]: isFirstInFuture,
        [styles.selected]: isSelected,
        [styles.future]: !isInPast,
        [styles.unloaded]: !isInLoadedRegion,
      })}
      onClick={() => onClick(row.original)}
      ref={ref}
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
