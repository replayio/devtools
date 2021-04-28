import React, { useState } from "react";
import classnames from "classnames";
const DashboardViewerHeader = require("./DashboardViewerHeader").default;
const DashboardViewerContent = require("./DashboardViewerContent").default;
import { SelectMenu } from "ui/components/shared/Forms";
import { getUserId } from "ui/utils/useToken";
import { Recording } from "ui/types";

const TIME_IN_MS = {
  day: 86400000,
  week: 86400000 * 7,
  month: 86400000 * 30,
};

type AssociationFilter = "all" | "created" | "shared" | "commented";
type TimeFilter = "all" | "day" | "week" | "month";

function filterRecordings(
  recordings: Recording[],
  associationFilter: AssociationFilter,
  timeFilter: TimeFilter
) {
  let filteredRecordings = recordings;
  const userId = getUserId();

  if (associationFilter == "shared") {
    filteredRecordings = filteredRecordings.filter(r =>
      r.collaborators?.find(c => c.user_id == userId)
    );
  } else if (associationFilter == "commented") {
    filteredRecordings = filteredRecordings.filter(r => r.comments?.find(c => c.user_id == userId));
  } else if (associationFilter == "created") {
    filteredRecordings = filteredRecordings.filter(r => r.user_id == userId);
  }

  if (timeFilter !== "all") {
    filteredRecordings = filteredRecordings.filter(
      r => new Date().getTime() - new Date(r.date).getTime() < TIME_IN_MS[timeFilter]
    );
  }

  return filteredRecordings;
}

export default function DashboardViewer({
  recordings,
  showAssociationFilter,
}: {
  recordings: Recording[];
  showAssociationFilter: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [associationFilter, setAssociationFilter] = useState<AssociationFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };

  const filteredRecordings = filterRecordings(recordings, associationFilter, timeFilter);

  return (
    <div className={classnames("dashboard-viewer", { editing })}>
      <DashboardViewerHeader
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        filters={
          <>
            {showAssociationFilter ? (
              <SelectMenu
                selected={associationFilter}
                setSelected={value => setAssociationFilter(value as AssociationFilter)}
                options={[
                  { id: "all", name: "All Replays" },
                  { id: "created", name: "Created Replays" },
                  { id: "shared", name: "Shared Replays" },
                  { id: "commented", name: "Commented Replays" },
                ]}
                className="w-64"
              />
            ) : null}
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
