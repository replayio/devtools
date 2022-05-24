import React from "react";

import { Dropdown, DropdownItem, DropdownItemContent } from "ui/components/Library/LibraryDropdown";
import { Column } from "react-table";

export default function ColumnsDropdown({ columns }: { columns: Column[] }) {
  const ColumnItem = ({ column }: { column: Column }) => {
    const attrs = (column as any).getToggleHiddenProps();
    return (
      <DropdownItem onClick={() => attrs.onChange({ target: { checked: !attrs.checked } })}>
        <DropdownItemContent
          selected={attrs.checked}
          icon={attrs.checked ? "checked" : "unchecked"}
        >
          <span className="capitalize">{String(column.id)}</span>
        </DropdownItemContent>
      </DropdownItem>
    );
  };

  return (
    <Dropdown>
      {columns.map(column => (
        <ColumnItem key={column.id} column={column} />
      ))}
    </Dropdown>
  );
}
