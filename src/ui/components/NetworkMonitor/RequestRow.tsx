import classNames from "classnames";
import React, { useLayoutEffect, useRef } from "react";
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
  showContentMenuAt,
}: {
  currentTime: number;
  isFirstInFuture: boolean;
  isInPast: boolean;
  isSelected: boolean;
  onClick: (row: RequestSummary) => void;
  onSeek: (row: RequestSummary) => void;
  row: Row<RequestSummary>;
  showContentMenuAt: (params: { pageX: number; pageY: number; row: Row<RequestSummary> }) => void;
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

  const onContextMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    showContentMenuAt({ pageX: event.pageX, pageY: event.pageY, row });
  };

  return (
    <div
      key={row.getRowProps().key}
      className={classNames(styles.row, {
        [styles.current]: isFirstInFuture,
        [styles.selected]: isSelected,
        [styles.future]: !isInPast,
      })}
      onClick={() => onClick(row.original)}
      onContextMenu={onContextMenu}
      ref={ref}
      tabIndex={0}
    >
      <div {...row.getRowProps()}>
        {row.original.triggerPoint && row.original.triggerPoint.time !== currentTime && (
          <button
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
            <span className={classNames("px-2 text-timejumpText", styles.verbose)}>
              {row.original.triggerPoint.time > currentTime ? "Fast-forward" : "Rewind"}
            </span>
          </button>
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
              title={cell.value}
            >
              <div className={(cell.column as any).className}>{cell.render("Cell")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
