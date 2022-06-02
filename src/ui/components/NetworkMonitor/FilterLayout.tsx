import classNames from "classnames";
import { useState } from "react";

import MaterialIcon from "../shared/MaterialIcon";
import Icon from "../shared/Icon";

import { CanonicalRequestType, RequestTypeOptions } from "./utils";

export function FilterLayout({
  setFilterValue,
  table,
  toggleType,
  types,
}: {
  setFilterValue: (value: string) => void;
  table: React.ReactNode;
  toggleType: (type: CanonicalRequestType) => void;
  types: Set<CanonicalRequestType>;
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <div className="bg-bodyBgcolor p-1">
        <div className="flex items-center rounded-md bg-themeTextFieldBgcolor p-1">
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
            onChange={event => setFilterValue(event.target.value)}
            className="w-full bg-transparent px-1 text-themeTextFieldColor focus:outline-none"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {filterOpen ? (
          <div className="flex basis-32 flex-col overflow-auto border-r border-splitter bg-bodyBgcolor px-0.5">
            {RequestTypeOptions.map(canonicalType => (
              <button
                key={canonicalType.label}
                className="group flex items-center gap-2 p-1.5"
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

        {table}
      </div>
    </>
  );
}
