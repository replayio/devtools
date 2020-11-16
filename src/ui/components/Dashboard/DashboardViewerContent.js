import React, { useState } from "react";
import classnames from "classnames";
import Recording from "./RecordingItem/index";
import { sortBy } from "lodash";

export default function DashboardViewerContent({
  recordings,
  viewType,
  selectedIds,
  setSelectedIds,
  editing,
}) {
  const [ascOrder, setAscOrder] = useState(false);
  const sortedRecordings = sortBy(recordings, recording => {
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date);
  });

  return (
    <section className="dashboard-viewer-content">
      <ul className={classnames("recording-list", viewType)}>
        {viewType == "list" ? (
          <DashboardViewerContentHeader
            recordings={recordings}
            setSelectedIds={setSelectedIds}
            selectedIds={selectedIds}
            ascOrder={ascOrder}
            setAscOrder={setAscOrder}
          />
        ) : null}
        {sortedRecordings &&
          sortedRecordings.map((recording, i) => (
            <Recording
              data={recording}
              key={i}
              viewType={viewType}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              editing={editing}
            />
          ))}
      </ul>
    </section>
  );
}

function DashboardViewerContentHeader({
  recordings,
  selectedIds,
  setSelectedIds,
  ascOrder,
  setAscOrder,
}) {
  const handleHeaderCheckboxClick = () => {
    if (selectedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recordings.map(r => r.recording_id));
    }
  };

  return (
    <header className="dashboard-viewer-content-header">
      <input type="checkbox" onChange={handleHeaderCheckboxClick} checked={selectedIds.length} />
      <div>PREVIEW</div>
      <div>TITLE</div>
      <div>PAGE TITLE</div>
      <div>DURATION</div>
      <div className="sorter" onClick={() => setAscOrder(!ascOrder)}>
        <span className="label">CREATED</span>
        {ascOrder ? <div className="img arrow-up-2" /> : <div className="img arrow-down-2" />}
      </div>
      <div>PRIVACY</div>
      <div>OWNER</div>
    </header>
  );
}
