import React, { useState } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import { isDeployPreview } from "ui/utils/environment";
import useAuth0 from "ui/utils/useAuth0";
import "./UserOptions.css";

function UserOptions({ recordingId, setModal }) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated } = useAuth0();

  const showShare = hooks.useIsOwner(recordingId || "00000000-0000-0000-0000-000000000000");

  if (isDeployPreview()) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  const onLibraryClick = () => {
    const dashboardUrl = `${window.location.origin}/view`;

    if (event.metaKey) {
      return window.open(dashboardUrl);
    }
    window.location = dashboardUrl;
  };
  const onShareClick = () => {
    setExpanded(false);
    setModal("sharing", { recordingId });
  };
  const onSettingsClick = () => {
    setExpanded(false);
    setModal("settings");
  };

  return (
    <div className="user-options">
      <Dropdown
        buttonContent={<span className="material-icons more">more_horiz</span>}
        setExpanded={setExpanded}
        expanded={expanded}
        orientation="bottom"
      >
        {recordingId ? (
          <button className="row" onClick={onLibraryClick}>
            <span className="material-icons">home</span>
            <span>Library</span>
          </button>
        ) : null}
        {showShare && (
          <button className="row" onClick={onShareClick}>
            <span className="material-icons">share</span>
            <span>Share</span>
          </button>
        )}
        <button className="row" onClick={onSettingsClick}>
          <span className="material-icons">settings</span>
          <span>Settings</span>
        </button>
        <LoginButton />
      </Dropdown>
    </div>
  );
}

export default connect(state => ({ recordingId: selectors.getRecordingId(state) }), {
  setModal: actions.setModal,
})(UserOptions);
