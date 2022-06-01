import classNames from "classnames";
import { useState } from "react";

import MaterialIcon from "../shared/MaterialIcon";
import Icon from "../shared/Icon";

import { CanonicalRequestType, RequestTypeOptions } from "./utils";

export function Filter({
  children,
  types,
  toggleType,
  table,
}: {
  children: React.ReactNode;
  types: Set<CanonicalRequestType>;
  toggleType: (type: CanonicalRequestType) => void;
  table: any;
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <div className="flex items-center bg-themeTextFieldBgcolor p-1">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={classNames("mr-1 flex items-center", {
            "text-primaryAccent hover:text-primaryAccentHover focus:text-primaryAccentHover":
              types.size > 0,
          })}
        >
          <MaterialIcon iconSize="lg" outlined={true}>
            filter_alt
          </MaterialIcon>
        </button>

        <MaterialIcon iconSize="lg">search</MaterialIcon>

        <input
          placeholder="Filter requests"
          onChange={e => table.setGlobalFilter(e.target.value)}
          className="w-full bg-transparent px-1 text-themeTextFieldColor focus:outline-none"
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {filterOpen ? (
          <div className="flex basis-32 flex-col overflow-auto bg-toolbarBackground px-0.5 py-1.5">
            {RequestTypeOptions.map(canonicalType => (
              <button
                key={canonicalType.label}
                className="group flex items-center gap-2 px-1 py-1.5"
                onClick={() => toggleType(canonicalType.type)}
              >
                <Icon
                  size="small"
                  filename={canonicalType.icon}
                  className={classNames(
                    "group-hover:bg-primaryAccent",
                    types.has(canonicalType.type) ? "bg-primaryAccent" : "bg-gray-400"
                  )}
                />
                {canonicalType.label}
              </button>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </>
  );
}
