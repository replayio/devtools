import React, { useState } from "react";

import { Recording } from "shared/graphql/types";

import ViewerHeader from "./Header/RecordingsPageViewerHeader";
import { Recordings } from "./Recordings";
import styles from "../../../Library.module.css";

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
          <div id="recording-list" className="flex-grow overflow-y-auto">
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
