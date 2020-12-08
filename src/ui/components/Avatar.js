import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getAvatarColor } from "ui/utils/user";

const Avatar = props => {
  let { player, isFirstPlayer } = props;
  let auth = useAuth0();

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

export default Avatar;
