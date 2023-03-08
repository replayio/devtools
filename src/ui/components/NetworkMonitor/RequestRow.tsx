import classNames from "classnames";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { Row } from "react-table";

// eslint-disable-next-line no-restricted-imports
import { client } from "protocol/socket";
import { getSessionId } from "ui/actions/app";
import { enableCopyCUrl } from "ui/actions/network";
import useNetworkContextMenu from "ui/components/NetworkMonitor/useNetworkContextMenu";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { RequestSummary } from "./utils";
import styles from "./RequestTable.module.css";

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
  const dispath = useAppDispatch();
  const prevIsSelectedRef = useRef<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const data = row.original;
  // Make sure newly selected Network requests have been scrolled into view.
  useLayoutEffect(() => {
    if (isSelected && !prevIsSelectedRef.current) {
      ref.current!.scrollIntoView({ block: "nearest" });
    }

    prevIsSelectedRef.current = isSelected;
  }, [isSelected]);

  const sessionId = useAppSelector(getSessionId)!;

  const { contextMenu, onContextMenu } = useNetworkContextMenu(row);

  const onNetworkContextMenu = useCallback(
    async (event: any) => {
      onContextMenu(event);
      if (data.hasRequestBody) {
        await client.Network.getRequestBody({ id: data.id, range: { end: 5e9 } }, sessionId);
        dispath(enableCopyCUrl(data.id));
      }
    },
    [data.id, data.hasRequestBody, sessionId, onContextMenu, dispath]
  );

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
        onContextMenu={onNetworkContextMenu}
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
      {contextMenu}
    </>
  );
};
