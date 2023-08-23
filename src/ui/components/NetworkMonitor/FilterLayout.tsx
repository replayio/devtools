import classNames from "classnames";
import { useState } from "react";

import Checkbox from "../shared/Forms/Checkbox";
import MaterialIcon from "../shared/MaterialIcon";
import { CanonicalRequestType, RequestTypeOptions } from "./utils";

export const FilterLayout = ({
  filterByText,
  setFilterByText,
  toggleType,
  types,
}: {
  filterByText: string;
  setFilterByText: (value: string) => void;
  toggleType: (type: CanonicalRequestType) => void;
  types: Set<CanonicalRequestType>;
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <div className="flex items-center bg-bodyBgcolor p-1 pl-0">
        <div className={classNames("pl-1", filterOpen && "basis-32")}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={classNames("flex items-center", {
              "mr-1": !filterOpen,
              "text-primaryAccent hover:text-primaryAccentHover focus:text-primaryAccentHover":
                types.size > 0,
            })}
          >
            <MaterialIcon iconSize="lg" outlined={true}>
              filter_alt
            </MaterialIcon>
          </button>
        </div>
        <div className="flex flex-1 items-center rounded-md bg-themeTextFieldBgcolor p-1">
          <MaterialIcon iconSize="lg">search</MaterialIcon>

          <input
            placeholder="Filter requests"
            onChange={event => setFilterByText(event.target.value)}
            className="w-full bg-transparent px-1 text-themeTextFieldColor focus:outline-none"
            value={filterByText}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {filterOpen ? (
          <div className="flex basis-32 flex-col overflow-auto border-r border-splitter bg-bodyBgcolor px-1.5 py-0.5">
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
