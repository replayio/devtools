import classNames from "classnames";

import MaterialIcon from "../shared/MaterialIcon";
import { CanonicalRequestType } from "./utils";

export function TextFilterRow({
  filterByText,
  setFilterByText,
  setShowTypeFilters,
  showTypeFilters,
  types,
}: {
  filterByText: string;
  setFilterByText: (value: string) => void;
  setShowTypeFilters: (value: boolean) => void;
  showTypeFilters: boolean;
  types: Set<CanonicalRequestType>;
}) {
  return (
    <>
      <div className="flex items-center bg-bodyBgcolor p-1 pl-0">
        <div className={classNames("pl-1", showTypeFilters && "basis-32")}>
          <button
            onClick={() => setShowTypeFilters(!showTypeFilters)}
            className={classNames("flex items-center", {
              "mr-1": !showTypeFilters,
              "text-primaryAccent hover:text-primaryAccentHover focus:text-primaryAccentHover":
                types.size > 0,
            })}
            data-test-id="Network-ToggleFilterByTypePanelButton"
            data-test-state={showTypeFilters ? "open" : "closed"}
          >
            <MaterialIcon iconSize="lg" outlined={true}>
              filter_alt
            </MaterialIcon>
          </button>
        </div>
        <div className="flex flex-1 items-center rounded-md bg-themeTextFieldBgcolor p-1">
          <MaterialIcon iconSize="lg">search</MaterialIcon>

          <input
            className="w-full bg-transparent px-1 text-themeTextFieldColor focus:outline-none"
            data-test-id="Network-TextFilterInput"
            onChange={event => setFilterByText(event.target.value)}
            placeholder="Filter requests"
            value={filterByText}
          />
        </div>
      </div>
    </>
  );
}
