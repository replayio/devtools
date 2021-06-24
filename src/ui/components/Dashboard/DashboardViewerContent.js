import React, { useState } from "react";
import classnames from "classnames";
import Recording from "./RecordingItem/index";
import sortBy from "lodash/sortBy";
import { isReplayBrowser } from "ui/utils/environment";

function getErrorText() {
  if (isReplayBrowser()) {
    return "Please open a new tab and press the blue record button to record a Replay";
  }

  return <DownloadLinks />;
}

function DownloadLinks() {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="flex flex-col space-y-8" style={{ maxWidth: "32rem" }}>
        <div>Download started.</div>
        <div>{`Once the download is finished, open the Replay Browser installer to install Replay`}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8" style={{ maxWidth: "32rem" }}>
      <div>{`There's nothing here yet. To create your first replay, you first need to download the Replay Browser`}</div>
      <div className="grid gap-4 grid-cols-2">
        <a
          href="https://replay.io/downloads/replay.dmg"
          className={
            "w-full text-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-blue-600 hover:bg-blue-700"
          }
          onClick={() => setClicked(true)}
        >
          Download for Mac
        </a>
        <a
          href="https://replay.io/downloads/linux-replay.tar.bz2"
          className={
            "w-full text-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-blue-600 hover:bg-blue-700"
          }
          onClick={() => setClicked(true)}
        >
          Download for Linux
        </a>
      </div>
    </div>
  );
}

export default function DashboardViewerContent({
  recordings,
  selectedIds,
  setSelectedIds,
  editing,
  timeFilter,
  associationFilter,
  searchString,
}) {
  const [ascOrder, setAscOrder] = useState(false);
  let sortedRecordings = sortBy(recordings, recording => {
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date);
  });

  if (!recordings.length) {
    let errorText;
    if (timeFilter != "all" || associationFilter != "all" || searchString) {
      errorText = "No replays found, please expand your search";
    } else {
      errorText = getErrorText();
    }

    return (
      <section className="dashboard-viewer-content grid items-center justify-center">
        <span className="text-xl text-gray-500">{errorText}</span>
      </section>
    );
  }

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
  const addSelectedId = recordingId => setSelectedIds([...selectedIds, recordingId]);
  const removeSelectedId = recordingId =>
    setSelectedIds(selectedIds.filter(id => id !== recordingId));

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
          recordings.map(recording => (
            <Recording
              data={recording}
              key={recording.id}
              selected={selectedIds.includes(recording.id)}
              addSelectedId={addSelectedId}
              removeSelectedId={removeSelectedId}
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
      <th>ACTIVITY</th>
      <th></th>
    </tr>
  );
}
