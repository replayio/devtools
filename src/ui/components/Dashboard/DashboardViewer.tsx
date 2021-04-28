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

type TimeFilter = "all" | "month" | "week" | "day";

function filterRecordings(recordings: Recording[], timeFilter: TimeFilter) {
  let filteredRecordings = recordings;

  if (timeFilter !== "all") {
    filteredRecordings = filteredRecordings.filter(
      r => new Date().getTime() - new Date(r.date).getTime() < TIME_IN_MS[timeFilter]
    );
  }

  return filteredRecordings;
}

export default function DashboardViewer({ recordings }: { recordings: Recording[] }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };

  const filteredRecordings = filterRecordings(recordings, timeFilter);

  return (
    <div className={classnames("dashboard-viewer flex-grow", { editing })}>
      <DashboardViewerHeader
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        filters={
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
