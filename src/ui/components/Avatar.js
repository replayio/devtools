import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import { connect } from "react-redux";
import { actions } from "ui/actions";
import { getAvatarColor } from "ui/utils/user";

function sendUserToBrowser(user) {
  user = user === null ? "" : user;
  if (typeof window == "object") {
    window.dispatchEvent(
      new window.CustomEvent("WebChannelMessageToChrome", {
        detail: JSON.stringify({
          id: "record-replay",
          message: { user },
        }),
      })
    );
  }
}

const Avatar = props => {
  let { player, isFirstPlayer, updateUser } = props;
  let auth = useAuth0();

  useEffect(() => {
    sendUserToBrowser(auth.user);
    updateUser(auth.user);
  }, [auth.user]);

  if (auth.isAuthenticated && isFirstPlayer) {
    return (
      <div className={`avatar authenticated first-player`}>
        <img src={auth.user.picture} alt={auth.user.name} />
      </div>
    );
  }

  return (
    <div
      className={`avatar ${isFirstPlayer ? "first-player" : ""}`}
      style={{ background: getAvatarColor(player?.avatarID) }}
    />
  );
};

export default connect(null, {
  updateUser: actions.updateUser,
})(Avatar);
