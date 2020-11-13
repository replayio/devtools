import React, { useState } from "react";
import classnames from "classnames";
import Title from "../../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import Avatar from "ui/components/Avatar";
import moment from "moment";
import { useAuth0 } from "@auth0/auth0-react";

function getDurationString(durationMs) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

function formatDate(date) {
  return moment(date).format("M/D/YYYY");
}

function CopyLinkButton({ recordingId }) {
  const [clicked, setClicked] = useState(false);
  const linkUrl = `${window.location.href}view?id=${recordingId}`;

  const handleCopyClick = e => {
    e.stopPropagation();
    setClicked(true);
    navigator.clipboard.writeText(linkUrl);
    setTimeout(() => setClicked(false), 1000);
  };

  return (
    <button className={classnames({ clicked })} onClick={handleCopyClick}>
      <img className="img link-horizontal" />
      <span>{clicked ? "COPIED" : "COPY LINK"}</span>
    </button>
  );
}

export default function RecordingListItem({
  data,
  Panel,
  onNavigate,
  editingTitle,
  setEditingTitle,
  toggleIsPrivate,
  setSelectedIds,
  selectedIds,
}) {
  const { user } = useAuth0();
  const { recording_id: recordingId } = data;
  const selected = selectedIds.includes(recordingId);

  const toggleChecked = () => {
    if (selected) {
      setSelectedIds(selectedIds.filter(id => id !== recordingId));
    } else {
      setSelectedIds([...selectedIds, recordingId]);
    }
  };

  console.log(data);

  return (
    <li className={classnames("recording-item", { selected })} onClick={onNavigate}>
      <input
        type="checkbox"
        onClick={e => e.stopPropagation()}
        onChange={toggleChecked}
        checked={selected}
      />
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
      </div>
      <div className="item-title">
        <div className="item-title-label">
          <Title
            defaultTitle={data.recordingTitle || data.title || "Untitled"}
            recordingId={data.recording_id}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
          />
          <div className="item-title-label-actions">
            <CopyLinkButton recordingId={data.recording_id} />
          </div>
        </div>
        <div className="page-url">Created {moment(data.date).fromNow()}</div>
      </div>
      <div className="page">
        <div className="page-title">{data.title || "No page title found"}</div>
        <div className="page-url">{data.url}</div>
      </div>
      <div>{getDurationString(data.duration)}</div>
      <div className="secondary">{formatDate(data.date)}</div>
      <div className="permissions" onClick={toggleIsPrivate}>
        {data.is_private ? "Private" : "Public"}
      </div>
      <div className="owner">
        <Avatar player={user} isFirstPlayer={true} />
      </div>
      <div className="more" onClick={e => e.stopPropagation()}>
        <Dropdown
          panel={Panel}
          icon={<div className="img dots-horizontal" />}
          panelStyles={{ top: "28px", right: "0px" }}
        />
      </div>
    </li>
  );
}
