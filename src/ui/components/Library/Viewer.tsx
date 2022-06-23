import ViewerHeader from "./ViewerHeader";
import React, { useState, useContext } from "react";
import { Recording } from "ui/types";

import styles from "./Library.module.css";
import { LibraryContext } from "./useFilters";
import { TestRunOverview } from "./Overview/TestRunOverview";
import { TestRunList } from "./Content/TestRuns/TestRunList";
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
    <div className={`flex flex-grow flex-col overflow-hidden p-4 ${styles.libraryWrapper}`}>
      <div className="flex h-full space-x-2 overflow-y-auto">
        <div className="flex w-full flex-grow flex-col space-y-5">
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
            {(view === "recordings" || view === "test-results") && (
              <Recordings
                view={view}
                isEditing={isEditing}
                recordings={recordings}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            )}
            {view === "test-runs" && <TestRunList />}
          </div>
        </div>
        {preview ? <TestRunOverview /> : null}
      </div>
    </div>
  );
}
