import React, { useState } from "react";
import classnames from "classnames";
import Recording from "./RecordingItem/index";
import sortBy from "lodash/sortBy";

export default function DashboardViewerContent({
  recordings,
  viewType,
  selectedIds,
  setSelectedIds,
  editing,
}) {
  const [ascOrder, setAscOrder] = useState(false);
  let sortedRecordings = sortBy(recordings, recording => {
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date);
  });

  return (
    <section className="dashboard-viewer-content">
      <div className={classnames("recording-list", viewType)}>
        {viewType == "list" ? (
          <RecordingsList
            recordings={sortedRecordings}
            viewType={viewType}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            editing={editing}
            ascOrder={ascOrder}
            setAscOrder={setAscOrder}
          />
        ) : (
          <ul>
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
        )}
      </div>
    </section>
  );
}

function RecordingsList({
  recordings,
  viewType,
  selectedIds,
  setSelectedIds,
  editing,
  ascOrder,
  setAscOrder,
}) {
  return (
    <table className="dashboard-viewer-content-table">
      <thead className="dashboard-viewer-content-header">
        <DashboardViewerContentHeader
          recordings={recordings}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          ascOrder={ascOrder}
          setAscOrder={setAscOrder}
        />
      </thead>
      <tbody className="dashboard-viewer-content-body">
        {recordings &&
          recordings.map((recording, i) => (
            <Recording
              data={recording}
              key={i}
              viewType={viewType}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              editing={editing}
            />
          ))}
      </tbody>
    </table>
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
    <tr>
      <th>
        <input type="checkbox" onChange={handleHeaderCheckboxClick} checked={selectedIds.length} />
      </th>
      <th>PREVIEW</th>
      <th>TITLE</th>
      <th>LENGTH</th>
      <th className="sorter" onClick={() => setAscOrder(!ascOrder)}>
        <span className="label">CREATED</span>
        {ascOrder ? <div className="img arrow-up-2" /> : <div className="img arrow-down-2" />}
      </th>
      <th>PRIVACY</th>
      <th>OWNER</th>
      <th></th>
    </tr>
  );
}
