import React from "react";
import { getAvatarColor } from "ui/utils/user";
import useAuth from "ui/utils/auth/useAuth";

export const AuthAvatar = ({ user }) => {
  return (
    <div className={`avatar authenticated first-player`}>
      <img src={user.profileImageUrl} alt={user.fullName} />
    </div>
  );
};

export default function Avatar({ player, isFirstPlayer, index }) {
  const { user } = useAuth();

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
