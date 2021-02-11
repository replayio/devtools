import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getAvatarColor } from "ui/utils/user";
import { useUser } from "@clerk/clerk-react";

export const AuthAvatar = ({ user }) => {
  return (
    <div className={`avatar authenticated first-player`}>
      <img src={user.profileImageUrl} alt={user.fullName} />
    </div>
  );
};

export default function Avatar({ player, isFirstPlayer, index }) {
  const user = useUser();

  if (user && isFirstPlayer) {
    return <AuthAvatar user={player} />;
  }

  if (player.fullName) {
    return (
      <div className={`avatar`} title={player.fullName}>
        <img src={player.profileImageUrl} alt={player.fullName} />
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
