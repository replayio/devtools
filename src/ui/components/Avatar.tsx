import React from "react";
import { User } from "ui/types";
import useAuth0 from "ui/utils/useAuth0";
import { getAvatarColor } from "ui/utils/user";

export const AuthAvatar = ({ user }: { user: User }) => {
  return (
    <div className={`avatar authenticated first-player`}>
      <img src={user.picture} alt={user.name} />
    </div>
  );
};

export interface AvatarProps {
  player: any;
  isFirstPlayer: boolean;
  index?: number;
}

export default function Avatar({ player, isFirstPlayer, index }: AvatarProps) {
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
