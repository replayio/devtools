import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getAvatarColor } from "ui/utils/user";

const Avatar = props => {
  let { player, isFirstPlayer, updateUser, isLoggedIn, setLoggedIn, setLoggedOut } = props;
  let auth = useAuth0();

  if (auth.isAuthenticated && isFirstPlayer) {
    if (!player.name) {
      // Check if the user has just logged out. If so, update and add the associated
      // picture and name from the user metadata.
      updateUser(auth.user);
    }

    return (
      <div className={`avatar authenticated first-player`}>
        <img src={auth.user.picture} alt={auth.user.name} />
        <span className="avatar-name">{auth.user.name}</span>
      </div>
    );
  }

  // Check if the user has just logged out. If so, update and remove the associated
  // picture and name from the user metadata.
  if (!auth.isAuthenticated && isFirstPlayer && player.name) {
    updateUser();
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
