import classNames from "classnames";
import React, { useLayoutEffect, useRef } from "react";
import { Row } from "react-table";

import useNetworkContextMenu from "ui/components/NetworkMonitor/useNetworkContextMenu";

import { RequestSummary } from "./utils";
import styles from "./RequestTable.module.css";

export const RequestRow = ({
  currentTime,
  isFirstInFuture,
  isInLoadedRegion,
  onClipboardCopy,
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
  onClipboardCopy: () => void;
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

  const { contextMenu, onContextMenu } = useNetworkContextMenu({ row, onClipboardCopy });

  return (
    <>
      <div
        key={row.getRowProps().key}
        className={classNames(styles.row, {
          [styles.current]: isFirstInFuture,
          [styles.selected]: isSelected,
          [styles.future]: !isInPast,
          [styles.unloaded]: !isInLoadedRegion,
        })}
        onClick={() => onClick(row.original)}
        onContextMenu={onContextMenu}
        ref={ref}
        tabIndex={0}
        data-testid="NetworkMonitor-RequestTable-RequestRow"
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
      {contextMenu}
    </>
  );
};
