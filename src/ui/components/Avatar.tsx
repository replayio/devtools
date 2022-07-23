import React from "react";
import { User } from "ui/types";
import useAuth0 from "ui/utils/useAuth0";
import { getAvatarColor } from "ui/utils/user";

import classNames from "classnames/bind";
import css from "./Avatar.module.css";
const cx = classNames.bind(css);

// The user image URLs that we get from Google sometimes fail to load, in that case
// we fall back to a transparent image (instead of showing the browser's icon for broken images)
type AvatarImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};
export const AvatarImage = (props: AvatarImageProps) => (
  <img
    data-private
    {...props}
    src={props.src || undefined}
    onError={e => (e.currentTarget.src = "/images/clear.png")}
  />
);

export const AuthAvatar = ({ user }: { user: User }) => {
  return (
    <div className={cx("avatar authenticated firstPlayer")}>
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
      <div className={cx("avatar")} title={player.name}>
        <AvatarImage src={player.picture} />
      </div>
    );
  }

  return (
    <div
      className={cx("avatar")}
      title={"Anonymous User"}
      style={{ background: getAvatarColor(index) }}
    />
  );
}
