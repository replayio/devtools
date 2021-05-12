import React, { useState } from "react";
import classnames from "classnames";
const DashboardViewerHeader = require("./DashboardViewerHeader").default;
const DashboardViewerContent = require("./DashboardViewerContent").default;
import { SelectMenu, TextInput } from "ui/components/shared/Forms";
import { getUserId } from "ui/utils/useToken";
import { Recording } from "ui/types";
import hooks from "ui/hooks";

const TIME_IN_MS = {
  day: 86400000,
  week: 86400000 * 7,
  month: 86400000 * 30,
};

type TimeFilter = "all" | "month" | "week" | "day";
type AssociationFilter = "all" | "collaborator" | "comment" | "author";

const subStringInString = (subString: string, string: string) => {
  return string.toLowerCase().includes(subString.toLowerCase());
};

function filterRecordings(
  recordings: Recording[],
  timeFilter: TimeFilter,
  associationFilter: AssociationFilter,
  searchString: string
) {
  let filteredRecordings = recordings;
  const { userId } = hooks.useGetUserId();

  if (timeFilter !== "all") {
    filteredRecordings = filteredRecordings.filter(
      r => new Date().getTime() - new Date(r.date).getTime() < TIME_IN_MS[timeFilter]
    );
  }

  if (associationFilter === "collaborator") {
    filteredRecordings = filteredRecordings.filter(
      r => r.collaborators && r.collaborators.some(c => c === userId)
    );
  } else if (associationFilter === "comment") {
    filteredRecordings = filteredRecordings.filter(
      r => r.comments && r.comments.some((c: any) => c.user.id === userId)
    );
  } else if (associationFilter === "author") {
    filteredRecordings = filteredRecordings.filter(r => r.userId === userId);
  }

  filteredRecordings = filteredRecordings.filter(
    r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
  );

  return filteredRecordings;
}

export default function DashboardViewer({ recordings }: { recordings: Recording[] }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchString, setSearchString] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [associationFilter, setAssociationFilter] = useState<AssociationFilter>("all");

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };

  const filteredRecordings = filterRecordings(
    recordings,
    timeFilter,
    associationFilter,
    searchString
  );

  return (
    <div className={classnames("dashboard-viewer flex-grow", { editing })}>
      <DashboardViewerHeader
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        searchString={searchString}
        setSearchString={setSearchString}
        filters={
          <>
            <SelectMenu
              selected={associationFilter}
              setSelected={value => setAssociationFilter(value as AssociationFilter)}
              options={[
                { id: "all", name: "All Replays" },
                { id: "comment", name: "Replays I've commented on" },
                { id: "collaborator", name: "Replays shared with me" },
                { id: "author", name: "Replays I've authored" },
              ]}
              className="w-72"
            />
            <SelectMenu
              selected={timeFilter}
              setSelected={value => setTimeFilter(value as TimeFilter)}
              options={[
                { id: "all", name: "All Time" },
                { id: "month", name: "This month" },
                { id: "week", name: "This week" },
                { id: "day", name: "Today" },
              ]}
              className="w-48"
            />
            <TextInput
              placeholder="Search..."
              value={searchString}
              onChange={e => setSearchString(e.target.value)}
            />
          </>
        }
      />
      <DashboardViewerContent
        recordings={filteredRecordings}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
      />
    </div>
  );
}
