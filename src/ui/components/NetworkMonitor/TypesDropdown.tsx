import classNames from "classnames";
import React, { useState } from "react";
import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import PortalDropdown from "ui/components/shared/PortalDropdown";

import { CanonicalRequestType, RequestTypeOptions } from "./utils";

export default function TypesDropdown({
  types,
  toggleType,
}: {
  types: Set<CanonicalRequestType>;
  toggleType: (type: CanonicalRequestType) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const button = (
    <MaterialIcon className="mr-2" iconSize="lg" outlined={true}>
      filter_alt
    </MaterialIcon>
  );

  const TypeItem = ({
    icon,
    label,
    type,
  }: {
    icon: string;
    type: CanonicalRequestType;
    label: string;
  }) => {
    return (
      <DropdownItem onClick={() => toggleType(type)}>
        <DropdownItemContent selected={types.has(type)} icon={icon}>
          {label}
        </DropdownItemContent>
      </DropdownItem>
    );
  };

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle={classNames({
        "text-primaryAccent hover:text-primaryAccentHover focus:text-primaryAccentHover":
          types.size > 0,
        "text-gray-400 hover:text-primaryAccentHover focus:text-primaryAccentHover":
          types.size === 0,
      })}
      distance={0}
      position="bottom-right"
    >
      <Dropdown>
        {RequestTypeOptions.map(canonicalType => (
          <TypeItem
            key={canonicalType.type}
            label={canonicalType.label}
            icon={canonicalType.icon}
            type={canonicalType.type}
          />
        ))}
      </Dropdown>
    </PortalDropdown>
  );
}
