import React, { useState } from "react";
import classnames from "classnames";
import DashboardViewerHeader from "./DashboardViewerHeader";
import DashboardViewerContent from "./DashboardViewerContent";
import { TextInput } from "ui/components/shared/Forms";
import { prefs } from "ui/utils/prefs";
import { Recording } from "ui/types";
import { RecordingId } from "@recordreplay/protocol";

const TIME_IN_MS = {
  day: 86400000,
  week: 86400000 * 7,
  month: 86400000 * 30,
};

export type TimeFilter = "all" | "month" | "week" | "day";
export type AssociationFilter = "all" | "collaborator" | "comment" | "author";

const subStringInString = (subString: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(subString.toLowerCase());
};

function filterRecordings(recordings: Recording[], searchString: string) {
  return recordings.filter(
    r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
  );
}

export default function DashboardViewer({ recordings }: { recordings: Recording[] }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<RecordingId[]>([]);
  const [searchString, setSearchString] = useState<string>("");

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };
  const filteredRecordings = filterRecordings(recordings, searchString);

  return (
    <div
      className={classnames("dashboard-viewer text-sm flex-grow bg-gray-100 px-8 py-6", {
        editing,
      })}
    >
      {/* <DashboardViewerHeader
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        filters={
          <>
            <TextInput
              placeholder="Search..."
              value={searchString}
              onChange={e => setSearchString((e.target as HTMLInputElement).value)}
            />
          </>
        }
      /> */}
      <DashboardViewerContent
        recordings={filteredRecordings}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        searchString={searchString}
      />
    </div>
  );
}
