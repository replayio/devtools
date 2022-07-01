import ViewerHeader from "./Header/RecordingsPageViewerHeader";
import React, { useState } from "react";
import { Recording } from "ui/types";
import styles from "../../../Library.module.css";
import { Recordings } from "./Recordings";

export function RecordingsPageViewer({
  recordings,
  workspaceName,
}: {
  recordings: Recording[];
  workspaceName: string | React.ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const handleDoneEditing = () => {
    setSelectedIds([]);
    setIsEditing(false);
  };

  return (
    <div className={`flex flex-grow flex-col overflow-hidden p-4 ${styles.libraryWrapper}`}>
      <div className="flex h-full space-x-2 overflow-y-auto">
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
            <Recordings
              isEditing={isEditing}
              recordings={recordings}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
