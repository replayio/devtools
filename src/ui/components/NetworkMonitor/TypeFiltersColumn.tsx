import { RequestTypeOptions } from "ui/components/NetworkMonitor/utils";

import Checkbox from "../shared/Forms/Checkbox";
import { CanonicalRequestType } from "./utils";

export function TypeFiltersColumn({
  toggleType,
  types,
}: {
  toggleType: (type: CanonicalRequestType) => void;
  types: Set<CanonicalRequestType>;
}) {
  return (
    <div
      className="flex basis-32 flex-col overflow-auto border-r border-splitter bg-bodyBgcolor px-1.5 py-0.5"
      data-test-id="Network-FilterByTypePanel"
    >
      {RequestTypeOptions.map(canonicalType => (
        <label className="flex select-none items-center py-1" key={canonicalType.label}>
          <div className="flex flex-grow flex-row items-center space-x-2">
            <Checkbox
              checked={types.has(canonicalType.type)}
              className="m-0"
              data-test-id={`Network-FilterTypeCheckbox-${canonicalType.label}`}
              data-test-state={types.has(canonicalType.type) ? "enabled" : "disabled"}
              onChange={() => toggleType(canonicalType.type)}
            />
            <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
              {canonicalType.label}
            </span>
          </div>
        </label>
      ))}
    </div>
  );
}
