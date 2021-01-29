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

export default function Avatar({ player, isFirstPlayer, index }) {
  let auth = useAuth0();

  if (auth.isAuthenticated && isFirstPlayer) {
    return <AuthAvatar user={auth.user} />;
  }

  if (player.name) {
    return (
      <div className={`avatar`} title={player.name}>
        <img src={player.picture} alt={player.name} />
      </div>
    );
  }

  return (
    <div
      className={`avatar`}
      title={"Anonymous User"}
      style={{ background: getAvatarColor(index) }}
    />
  );
}
