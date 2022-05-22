import classNames from "classnames";
import React from "react";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import { CanonicalRequestType, RequestTypeOptions } from "./utils";

export default function TypesDropdown({
  types,
  toggleType,
}: {
  types: Set<CanonicalRequestType>;
  toggleType: (type: CanonicalRequestType) => void;
}) {
  return (
    <Dropdown
      placement="bottom-start"
      triggerClassname={classNames({
        "flex text-primaryAccent hover:text-primaryAccentHover focus:text-primaryAccentHover outline-none": types.size > 0,
        "flex text-gray-400 hover:text-primaryAccentHover focus:text-primaryAccentHover outline-none": types.size === 0,
      })}
      trigger={
        <MaterialIcon className="mr-2" iconSize="lg" outlined={true}>
          filter_alt
        </MaterialIcon>
      }
    >
      {RequestTypeOptions.map(({ type, label, icon }) => (
        <DropdownItem key={type} onClick={() => toggleType(type)}>
          <DropdownItemContent selected={types.has(type)} icon={icon}>
            {label}
          </DropdownItemContent>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
