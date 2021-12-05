import React from "react";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { HeaderGroup } from "react-table";
import { RequestSummary } from "./utils";

export function HeaderGroups({ headerGroups }: { headerGroups: HeaderGroup<RequestSummary>[] }) {
  return (
    <div className="border-b">
      {headerGroups.map((headerGroup: HeaderGroup<RequestSummary>) => (
        <div className="flex font-normal items-center" {...headerGroup.getHeaderGroupProps()}>
          {headerGroup.headers.map(column => (
            <div className={classNames("p-1", styles[column.id])} {...column.getHeaderProps()}>
              {column.render("Header")}
              <div
                //@ts-ignore
                {...column.getResizerProps()}
                className={classNames("select-none", styles.resizer, {
                  //@ts-ignore typescript freaking *hates* react-table
                  isResizing: column.isResizing,
                })}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
