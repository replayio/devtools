import classNames from "classnames";
import { useState } from "react";

import MaterialIcon from "../shared/MaterialIcon";

import { CanonicalRequestType, RequestTypeOptions } from "./utils";
import Checkbox from "../shared/Forms/Checkbox";

export const FilterLayout = ({
  setFilterValue,
  table,
  toggleType,
  types,
}: {
  setFilterValue: (value: string) => void;
  table: React.ReactNode;
  toggleType: (type: CanonicalRequestType) => void;
  types: Set<CanonicalRequestType>;
}) => {
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
          <div
            className="flex basis-32 flex-col overflow-auto border-r border-splitter bg-bodyBgcolor px-2 py-0.5"
            style={{ paddingLeft: "0.55rem" }}
          >
            {RequestTypeOptions.map(canonicalType => (
              <ToggleRow
                key={canonicalType.label}
                selected={types.has(canonicalType.type)}
                onClick={() => toggleType(canonicalType.type)}
              >
                {canonicalType.label}
              </ToggleRow>
            ))}
          </div>
        ) : null}

        {table}
      </div>
    </>
  );
};

const ToggleRow = ({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <label className="flex select-none items-center py-1">
      <div className="flex flex-grow flex-row items-center space-x-2">
        <Checkbox checked={selected} className="m-0" onChange={onClick} />
        <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
          {children}
        </span>
      </div>
    </label>
  );
};
