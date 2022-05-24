import { Dropdown, DropdownItem } from "./LibraryDropdown";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

export function FilterDropdown({ setAppliedText }: { setAppliedText: (str: string) => void }) {
  const setStringAndCollapseDropdown = (str: string) => {
    setAppliedText(str);
  };
  const handleCreatedSince = (days: number) => {
    const secondsAgo = daysInSeconds(days);
    const isoString = new Date(new Date().getTime() - secondsAgo).toISOString().substr(0, 10);

    return setStringAndCollapseDropdown(`created:${isoString}`);
  };

  const button = (
    <div className="flex">
      <div className="text-sm">Filter</div>
      <div className="material-icons text-sm">expand_more</div>
    </div>
  );

  return (
    <Dropdown
      trigger={button}
      menuItemsClassName="z-50"
      triggerClassname="text-sm border border-textFieldBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-themeTextFieldColor rounded-md space-x-2 hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <DropdownItem onClick={() => setStringAndCollapseDropdown("")}>All Replays</DropdownItem>
      <DropdownItem onClick={() => handleCreatedSince(7)}>Last 7 days</DropdownItem>
      <DropdownItem onClick={() => setStringAndCollapseDropdown("target:node")}>
        Node replays
      </DropdownItem>
    </Dropdown>
  );
}
