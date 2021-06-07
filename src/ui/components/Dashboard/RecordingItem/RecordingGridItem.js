import React from "react";
import Title from "../../shared/Title";
import formatDate from "date-fns/format";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import { useGetUserInfo } from "ui/utils/users";
import hooks from "ui/hooks";

import "./RecordingGridItem.css";

export default function RecordingGridItem({
  data,
  Panel,
  onNavigate,
  editingTitle,
  setEditingTitle,
  toggleIsPrivate,
}) {
  const { id: userId } = useGetUserInfo();
  const { screenData } = hooks.useGetRecordingPhoto(data.id);

  const isOwner = userId == data.user.id;

  return (
    <div className="recording-item">
      <div className="screenshot">
        {screenData && <img src={screenData} alt="recording screenshot" />}
        <div className="overlay" onClick={e => onNavigate(e)} />
        {isOwner && <Dropdown panel={Panel} icon={<div>•••</div>} panelStyles={{ top: "28px" }} />}
      </div>
      <div className="description">
        <Title
          defaultTitle={data.title || "Untitled"}
          recordingId={data.id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          allowEditOnTitleClick={false}
        />
        <div className="secondary">{formatDate(new Date(data.date), "MMM do, h:mm aaa")}</div>
        <div className="permissions" onClick={toggleIsPrivate}>
          {data.private ? "Private" : "Public"}
        </div>
      </div>
    </div>
  );
}
