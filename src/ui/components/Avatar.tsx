import React from "react";
import { User } from "ui/types";
import useAuth0 from "ui/utils/useAuth0";
import { getAvatarColor } from "ui/utils/user";

// The user image URLs that we get from Google sometimes fail to load, in that case
// we fall back to a transparent image (instead of showing the browser's icon for broken images)
export const AvatarImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img data-private {...props} onError={e => (e.currentTarget.src = "/images/clear.png")} />
);

export const AuthAvatar = ({ user }: { user: User }) => {
  return (
    <div className={`avatar authenticated first-player`}>
      <AvatarImage src={user.picture} />
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
        <AvatarImage src={player.picture} />
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
