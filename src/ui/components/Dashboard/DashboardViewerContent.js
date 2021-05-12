import React, { useState } from "react";
import classnames from "classnames";
import Recording from "./RecordingItem/index";
import sortBy from "lodash/sortBy";

export default function DashboardViewerContent({
  recordings,
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
      <div className={classnames("recording-list")}>
        <RecordingsList
          recordings={sortedRecordings}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          editing={editing}
          ascOrder={ascOrder}
          setAscOrder={setAscOrder}
        />
      </div>
    </section>
  );
}

function RecordingsList({
  recordings,
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
              key={recording.id}
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
      setSelectedIds(recordings.map(r => r.id));
    }
  };

  return (
    <tr>
      <th>
        <input type="checkbox" onChange={handleHeaderCheckboxClick} checked={selectedIds.length} />
      </th>
      <th>PREVIEW</th>
      <th>TITLE</th>
      <th className="length">LENGTH</th>
      <th className="sorter created" onClick={() => setAscOrder(!ascOrder)}>
        <span className="label">CREATED</span>
        {ascOrder ? <div className="img arrow-up-2" /> : <div className="img arrow-down-2" />}
      </th>
      <th className="privacy">PRIVACY</th>
      <th className="owner">OWNER</th>
      <th></th>
    </tr>
  );
}
