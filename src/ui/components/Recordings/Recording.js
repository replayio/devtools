import React from "react";
import moment from "moment";

function formatDate(date) {
  return moment(date).format("MMM Do, h:mm a");
}

export const Recording = ({ data }) => {
  function navigateToRecording() {
    window.location = `/view?id=${data.recording_id}`;
  }
  return (
    <div className="recording">
      <div className="screenshot">
        <img src={`data:image/png;base64, ${data.last_screen_data}`} alt="recording screenshot" />
        {/* <Dropdown
          overlay={<OverlayMenu onDelete={onDelete} onRename={onRename} />}
          trigger={['click']}
          placement="bottomRight"
          onVisibleChange={handleVisibleChange}
          visible={dropdownVisible}
        >
          <Button type="text" className="more-btn">
            &middot;&middot;&middot;
          </Button>
        </Dropdown> */}
        <div className="overlay" onClick={() => navigateToRecording()} />
        {/* <button icon={<LinkIconSvg />} onClick={() => navigateToRecording} /> */}
      </div>
      <div className="title" onClick={() => navigateToRecording()}>
        {data.recordingTitle || data.title}
      </div>
      {/* <div className="title" onClick={() => setEnableTitleEdit(true)}>
        {data.recordingTitle || data.title}
      </div> */}
      <div className="secondary">{formatDate(data.date)}</div>
    </div>
  );
};
