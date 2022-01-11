import React, { useState } from "react";

import PortalDropdown from "ui/components/shared/PortalDropdown";
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
      buttonStyle={`${types.size > 0 ? "text-primaryAccent" : "text-gray-400"}`}
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
