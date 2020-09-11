const React = require("react");
import { connect } from "react-redux";
import { selectors } from "../reducers";

import "./Recordings.css";

const Recordings = props => (
  <div className="recordings">
    {props.recordings &&
      props.recordings.map((recording, i) => <Recording data={recording} key={i} />)}
  </div>
);

const Recording = props => {
  let dateString = new Date(props.data.date).toString().split(" ");
  let date = `${dateString[1]} ${dateString[2]}, ${dateString[4].slice(0, 5)}`;
  return (
    <div className="recording">
      <div className="screenshot">
        <img
          src={`data:image/png;base64, ${props.data.last_screen_data}`}
          alt="recording screenshot"
        />
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
        <div className="overlay" onClick={() => window.open(props.data.url, "_blank")} />
        {/* <button icon={<LinkIconSvg />} onClick={() => window.open(props.data.url, "_blank")} /> */}
      </div>
      <div className="title" onClick={() => window.open(props.data.url, "_blank")}>
        {props.data.recordingTitle || props.data.title}
      </div>
      {/* <div className="title" onClick={() => setEnableTitleEdit(true)}>
        {props.data.recordingTitle || props.data.title}
      </div> */}
      <div className="secondary">{date}</div>
    </div>
  );
};

export default connect(
  state => ({
    recordings: selectors.getRecordings(state),
  }),
  {}
)(Recordings);
