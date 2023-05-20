import classNames from "classnames";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  HeaderGroup,
  TableInstance,
  useBlockLayout,
  useGlobalFilter,
  useResizeColumns,
  useTable,
} from "react-table";

import { ThreadFront } from "protocol/thread";
import useLoadedRegions from "replay-next/src/hooks/useRegions";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegions } from "shared/utils/time";
import { getCurrentPoint } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { HeaderGroups } from "../NetworkMonitor/HeaderGroups";
import styles from "./Application.module.css";

type Cookie = { name: string; value: string; expires: string };
type Cookies = Cookie[];

/*
var allCookies = document.cookie;


var cookiesArray = allCookies.split(';');
var cookies = {};
for (var i = 0; i < cookiesArray.length; i++) {
  var cookie = cookiesArray[i].trim();
  var separatorIndex = cookie.indexOf('=');
  var cookieName = cookie.substring(0, separatorIndex);
  var cookieValue = cookie.substring(separatorIndex + 1);
  cookies[cookieName] = cookieValue;
}
cookies
*/
async function getCookies(replayClient: ReplayClientInterface): Promise<string> {
  const response = await ThreadFront.evaluate({
    replayClient: replayClient,
    text: `document.cookie;`,
  });

  console.log(response);
  return response.returned?.value ?? "";
}

function decodeCookie(cookie: string): {} {
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch (e) {
    return {};
  }
}

export function ApplicationPanel() {
  const replayClient = useContext(ReplayClientContext);
  const currentPoint = useAppSelector(getCurrentPoint);
  const loadedRegions = useLoadedRegions(replayClient);

  const [cookies, setCookies] = useState<Cookies>([]);

  useEffect(() => {
    if (
      replayClient &&
      currentPoint &&
      loadedRegions &&
      isPointInRegions(currentPoint, loadedRegions.loaded)
    ) {
      console.log("getting cookies", currentPoint);
      getCookies(replayClient).then(resp => {
        var cookiesArray = resp.split(";");
        var cookies = [];
        for (var i = 0; i < cookiesArray.length; i++) {
          var cookie = cookiesArray[i].trim();
          var separatorIndex = cookie.indexOf("=");
          var cookieName = cookie.substring(0, separatorIndex);
          var cookieValue = cookie.substring(separatorIndex + 1);
          var decodedCookie = decodeCookie(cookieValue);
          console.log(decodedCookie);

          cookies.push({
            name: cookieName,
            value: cookieValue,
            expires: decodedCookie.expires || "",
          });
        }

        setCookies(cookies);
      });
    }
  }, [replayClient, currentPoint, loadedRegions]);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Expires",
        accessor: "expires" as const,
      },
      {
        Header: "Value",
        accessor: "value" as const,
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data: cookies,
    },
    useGlobalFilter,
    useResizeColumns,
    useBlockLayout
  );

  return (
    <div>
      <div className="secondary-toolbox-content bg-chrome text-xs">
        <div className={classNames("no-scrollbar min-w-full bg-bodyBgcolor", "")}>
          {/* Relative here helps with when the timeline goes past the last request*/}
          <div
            className={classNames("flex h-full w-full flex-col overflow-x-auto", styles.request)}
            {...getTableProps()}
          >
            <HeaderGroups headerGroups={headerGroups as any} columns={columns as any} />

            <div className="relative w-fit min-w-full overflow-y-auto" {...getTableBodyProps()}>
              {rows.map((row, i) => {
                prepareRow(row);
                const { key: rowKey, ...rowProps } = row.getRowProps();

                return (
                  <div
                    key={rowKey}
                    tabIndex={0}
                    data-testid="Application-Cookies-Row"
                    className={classNames(styles.row)}
                    {...rowProps}
                  >
                    {row.cells.map((cell, cellIndex) => {
                      const { key, ...cellProps } = cell.getCellProps();
                      const isLastColumn = cellIndex === row.cells.length - 1;

                      return (
                        <div
                          key={key}
                          className={classNames(
                            `items-center overflow-hidden whitespace-nowrap p-1 ${
                              isLastColumn ? "flex-grow" : ""
                            }`,
                            styles[cell.column.id]
                          )}
                          {...cellProps}
                          style={{
                            ...cell.getCellProps().style,
                            display: "flex",
                            width: isLastColumn ? "fit-content" : cell.getCellProps().style?.width,
                          }}
                          title={cell.value}
                        >
                          <div className={(cell.column as any).className}>
                            {cell.render("Cell")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
