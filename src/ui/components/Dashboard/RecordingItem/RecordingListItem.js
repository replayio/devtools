import React, { useState } from "react";
import classnames from "classnames";
import Title from "../../shared/Title";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import { AuthAvatar } from "ui/components/Avatar";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import hooks from "ui/hooks";
import { ChatAltIcon } from "@heroicons/react/outline";
import "./RecordingListItem.css";

function getDurationString(durationMs) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

function CopyLinkButton({ recordingId }) {
  const [clicked, setClicked] = useState(false);
  const linkUrl = `${window.location.origin}/view?id=${recordingId}`;

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

function ItemOptions({ Panel }) {
  return (
    <div className="more" onClick={e => e.stopPropagation()}>
      <Dropdown
        panel={Panel}
        icon={<div className="img dots-horizontal" />}
        panelStyles={{ top: "28px", right: "0px" }}
      />
    </div>
  );
}

function ItemPrivacy({ isPrivate, toggleIsPrivate }) {
  return (
    <div className="permissions" onClick={toggleIsPrivate}>
      {isPrivate ? "Private" : "Public"}
    </div>
  );
}

function ItemCreatedDate({ date }) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 3 days, otherwise, use the template below.
  if (daysSince > 2) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return <div className="secondary">{content}</div>;
}

function ItemDuration({ duration }) {
  return <div>{getDurationString(duration)}</div>;
}

function ItemTitle({ data, editing, editingTitle, setEditingTitle, handleClickUrl }) {
  return (
    <div className="item-title">
      <div className="item-title-label">
        <Title
          defaultTitle={data.title || "Untitled"}
          recordingId={data.id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          allowEditOnTitleClick={false}
        />
        {!editing ? (
          <div className="item-title-label-actions">
            {/* <CopyLinkButton recordingId={data.id} /> */}
          </div>
        ) : null}
      </div>
      <div className="page-url">{data.url}</div>
    </div>
  );
}

function ItemScreenshot({ recordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <div className="screenshot">
      {screenData && <img src={screenData} alt="recording screenshot" />}
    </div>
  );
}

function ItemCheckbox({ toggleChecked, selected }) {
  return (
    <input
      type="checkbox"
      onClick={e => e.stopPropagation()}
      onChange={toggleChecked}
      checked={selected}
    />
  );
}

export default function RecordingListItem({
  data,
  Panel,
  onNavigate,
  editingTitle,
  setEditingTitle,
  toggleIsPrivate,
  addSelectedId,
  removeSelectedId,
  selected,
  editing,
}) {
  const { userId, loading } = hooks.useGetUserId();
  if (loading) {
    return null;
  }

  const { id: recordingId } = data;
  const isOwner = userId == data.user?.id;

  const toggleChecked = () => {
    if (selected) {
      removeSelectedId(recordingId);
    } else {
      addSelectedId(recordingId);
    }
  };

  const handleClick = e => {
    if (editing) {
      toggleChecked();
    } else {
      onNavigate(e);
    }
  };

  const handleClickUrl = e => {
    e.stopPropagation();
    window.open(data.url, "_blank");
  };

  return (
    <tr className={classnames("recording-item", { selected })} onClick={handleClick}>
      <td>
        <ItemCheckbox toggleChecked={toggleChecked} selected={selected} />{" "}
      </td>
      <td>
        <ItemScreenshot recordingId={recordingId} />
      </td>
      <td>
        <ItemTitle
          data={data}
          editing={editing}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          handleClickUrl={handleClickUrl}
        />
      </td>
      <td>
        <ItemDuration duration={data.duration} />
      </td>
      <td>
        <ItemCreatedDate date={data.date} />
      </td>
      <td>
        <ItemPrivacy isPrivate={data.private} toggleIsPrivate={toggleIsPrivate} />
      </td>
      <td>
        <div className="owner">{data.user && <AuthAvatar user={data.user} />}</div>
      </td>
      <td>
        {data.comments.length ? (
          <div className="flex flex-row space-x-1 items-center">
            <ChatAltIcon className="w-6 h-6 text-gray-500" />
            <span>{data.comments.length}</span>
          </div>
        ) : null}
      </td>
      <td>{isOwner && <ItemOptions Panel={Panel} />}</td>
    </tr>
  );
}
