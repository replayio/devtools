import React, { useState } from "react";
import classnames from "classnames";
import RecordingItem from "./RecordingItem/index";
import sortBy from "lodash/sortBy";
import { isReplayBrowser } from "ui/utils/environment";
import { Recording } from "ui/types";
import { RecordingId } from "@recordreplay/protocol";
import classNames from "classnames";

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
      <div className="flex flex-col space-y-6" style={{ maxWidth: "24rem" }}>
        <div>Download started.</div>
        <div>{`Once the download is finished, open the Replay Browser installer to install Replay`}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 text-sm" style={{ maxWidth: "24rem" }}>
      <div>{`There's nothing here yet. To create your first replay, you first need to download the Replay Browser`}</div>
      <div className="grid gap-3 grid-cols-2">
        <a
          href="https://replay.io/downloads/replay.dmg"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Mac
        </a>
        <a
          href="https://replay.io/downloads/linux-replay.tar.bz2"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Linux
        </a>
      </div>
    </div>
  );
}

interface DashboardViewerContentProps {
  recordings: Recording[];
  selectedIds: RecordingId[];
  setSelectedIds(ids: RecordingId[]): void;
  editing: boolean;
  searchString: string;
}

export default function DashboardViewerContent({
  recordings,
  selectedIds,
  setSelectedIds,
  editing,
  searchString,
}: DashboardViewerContentProps) {
  const [ascOrder, setAscOrder] = useState(false);
  let sortedRecordings = sortBy(recordings, recording => {
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date).getTime();
  });

  if (!recordings.length) {
    let errorText;
    if (searchString) {
      errorText = "No replays found, please expand your search";
    } else {
      errorText = getErrorText();
    }

    return (
      <section className="dashboard-viewer-content grid items-center justify-center text-sm">
        <span className="text-gray-500">{errorText}</span>
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

interface RecordingsListProps
  extends Pick<
    DashboardViewerContentProps,
    "recordings" | "selectedIds" | "setSelectedIds" | "editing"
  > {
  ascOrder: boolean;
  setAscOrder(ascOrder: boolean): void;
}

function RecordingsList({
  recordings,
  selectedIds,
  setSelectedIds,
  editing,
  ascOrder,
  setAscOrder,
}: RecordingsListProps) {
  const addSelectedId = (recordingId: RecordingId) => setSelectedIds([...selectedIds, recordingId]);
  const removeSelectedId = (recordingId: RecordingId) =>
    setSelectedIds(selectedIds.filter(id => id !== recordingId));

  return (
    <table className="dashboard-viewer-content-table rounded-md shadow-lg">
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
            <RecordingItem
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

type DashboardViewerContentHeaderProps = Pick<
  RecordingsListProps,
  "recordings" | "selectedIds" | "setSelectedIds" | "ascOrder" | "setAscOrder"
>;

function DashboardViewerContentHeader({
  recordings,
  selectedIds,
  setSelectedIds,
  ascOrder,
  setAscOrder,
}: DashboardViewerContentHeaderProps) {
  const handleHeaderCheckboxClick = () => {
    if (selectedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recordings.map(r => r.id));
    }
  };

  return (
    <tr className="bg-gray-50 font-normal text-xs uppercase text-gray-500 ">
      <Th>
        <input
          type="checkbox"
          onChange={handleHeaderCheckboxClick}
          checked={!!selectedIds.length}
        />
      </Th>
      <Th>TITLE</Th>
      <Th className="length">LENGTH</Th>
      <Th className="sorter created" onClick={() => setAscOrder(!ascOrder)}>
        <span className="label">CREATED</span>
        {ascOrder ? <div className="img arrow-up-2" /> : <div className="img arrow-down-2" />}
      </Th>
      <Th className="privacy">PRIVACY</Th>
      <Th className="owner">OWNER</Th>
      <Th>ACTIVITY</Th>
      <Th></Th>
    </tr>
  );
}

function Th({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={classNames(className, "flex align-items center py-1 pt-1 bg-gray-50")}
    >
      {children}
    </th>
  );
}

// display: flex;
// align-items: center;
// padding: 4px 4px 4px 0;
// border-bottom: 1px solid var(--theme-splitter-color);
// position: sticky;
// top: 0px;
