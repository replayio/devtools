import classNames from "classnames";
import React, { useState } from "react";
import { Column, HeaderGroup } from "react-table";
import { ContextMenu, ContextMenuItem, ContextMenuItemContent } from "ui/components/Library/ContextMenu";

import styles from "./RequestTable.module.css";
import { RequestSummary } from "./utils";

interface MenuLocation {
  x: number;
  y: number;
}

const ColumnItem = ({ column }: { column: Column }) => {
  const attrs = (column as any).getToggleHiddenProps();
  return (
    <ContextMenuItem onClick={() => attrs.onChange({ target: { checked: !attrs.checked } })}>
      <ContextMenuItemContent
        selected={attrs.checked}
        icon={attrs.checked ? "checked" : "unchecked"}
      >
        <span className="capitalize">{String(column.id)}</span>
      </ContextMenuItemContent>
    </ContextMenuItem>
  );
};

export function HeaderGroups({
  columns,
  headerGroups,
}: {
  columns: Column[];
  headerGroups: HeaderGroup<RequestSummary>[];
}) {
  const [menuLocation, setMenuLocation] = useState<MenuLocation>();
  return (
    <div
      className="border-b border-splitter bg-toolbarBackground"
      onContextMenu={ev => {
        ev.preventDefault();
        setMenuLocation({ x: ev.pageX, y: ev.pageY });
      }}
    >
      {menuLocation ? (
        <ContextMenu x={menuLocation.x} y={menuLocation.y} close={() => setMenuLocation(undefined)}>
          {columns.map(column => (
            <ColumnItem key={column.id} column={column} />
          ))}
        </ContextMenu>
      ) : (
        ""
      )}
      {headerGroups.map((headerGroup: HeaderGroup<RequestSummary>) => {
        const { key, ...headerProps } = headerGroup.getHeaderGroupProps();
        return (
          <div
            key={key}
            className="flex items-center divide-x divide-themeTextFieldBgcolor font-normal"
            {...headerProps}
          >
            {headerGroup.headers.map((column, index) => {
              const { key, ...columnProps } = column.getHeaderProps();
              const isLastColumn = index === headerGroup.headers.length - 1;
              return (
                <div className={classNames("p-1", styles[column.id])} {...columnProps} key={key}>
                  {column.render("Header")}
                  {!isLastColumn ? (
                    <div
                      //@ts-ignore
                      {...column.getResizerProps()}
                      className={classNames("select-none", styles.resizer, {
                        //@ts-ignore typescript freaking *hates* react-table
                        isResizing: column.isResizing,
                      })}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
