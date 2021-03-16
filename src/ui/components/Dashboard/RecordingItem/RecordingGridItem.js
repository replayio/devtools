import React from "react";
import Title from "../../shared/Title";
import formatDate from "date-fns/format";
import Dropdown from "devtools/client/debugger/src/components/shared/Dropdown";
import useToken from "ui/utils/useToken";
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
  const { claims } = useToken();
  const { screenData } = hooks.useGetRecordingPhoto(data.recording_id);

  const userId = claims?.hasura.userId;
  const isOwner = userId == data.user.id;

  return (
    <div className="recording-item">
      <div className="screenshot">
        {screenData && (
          <img src={`data:image/png;base64, ${screenData}`} alt="recording screenshot" />
        )}
        <div className="overlay" onClick={e => onNavigate(e)} />
        {isOwner && <Dropdown panel={Panel} icon={<div>•••</div>} panelStyles={{ top: "28px" }} />}
      </div>
      <div className="description">
        <Title
          defaultTitle={data.recordingTitle || data.title || "Untitled"}
          recordingId={data.recording_id}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          allowEditOnTitleClick={false}
        />
        <div className="secondary">{formatDate(new Date(data.date), "MMM do, h:mm aaa")}</div>
        <div className="permissions" onClick={toggleIsPrivate}>
          {data.is_private ? "Private" : "Public"}
        </div>
      </div>
    </div>
  );
}
