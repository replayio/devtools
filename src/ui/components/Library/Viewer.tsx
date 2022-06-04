import ViewerHeader from "./ViewerHeader";
import React, { useState, useContext } from "react";
import { Recording } from "ui/types";

import styles from "./Library.module.css";
import { LibraryContext } from "./useFilters";
import { Preview } from "./Preview/Preview";
import { TestRuns } from "./Content/TestRuns";
import { Tests } from "./Content/Tests/Tests";
import { Recordings } from "./Content/Recordings";

export default function Viewer({
  recordings,
  workspaceName,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
}) {
  const { view, preview } = useContext(LibraryContext);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const handleDoneEditing = () => {
    setSelectedIds([]);
    setIsEditing(false);
  };

  return (
    <div
      className={`flex flex-grow flex-col overflow-hidden bg-gray-100 px-8 py-6 ${styles.libraryWrapper}`}
    >
      <div className="flex h-full space-x-4 overflow-y-auto">
        <div className="flex flex-col flex-grow w-full space-y-5">
          <ViewerHeader
            recordings={recordings}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            handleDoneEditing={handleDoneEditing}
            workspaceName={workspaceName}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
          <div className="flex-grow overflow-y-auto">
            {view === "recordings" ? (
              <Recordings
                isEditing={isEditing}
                recordings={recordings}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            ) : view === "test-runs" ? (
              <TestRuns />
            ) : (
              <Tests />
            )}
          </div>
        </div>
        {preview ? <Preview /> : null}
      </div>
    </div>
  );
}
