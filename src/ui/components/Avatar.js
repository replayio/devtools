import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getAvatarColor } from "ui/utils/user";

export const AuthAvatar = ({ user }) => {
  return (
    <div className={`avatar authenticated first-player`}>
      <img src={user.picture} alt={user.name} />
    </div>
  );
};

const Avatar = props => {
  let { player, isFirstPlayer } = props;
  let auth = useAuth0();

  if (auth.isAuthenticated && isFirstPlayer) {
    return <AuthAvatar user={auth.user} />;
  }

  return (
    <div
      className={`avatar ${isFirstPlayer ? "first-player" : ""}`}
      style={{ background: getAvatarColor(player?.avatarID) }}
    />
  );
};

export default Avatar;
