import classNames from "classnames/bind";
import React, { useContext } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { User } from "shared/graphql/types";
import { getAvatarColor } from "ui/utils/user";

import css from "./Avatar.module.css";

const cx = classNames.bind(css);

// The user image URLs that we get from Google sometimes fail to load, in that case
// we fall back to a transparent image (instead of showing the browser's icon for broken images)
type AvatarImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};
export const AvatarImage = (props: AvatarImageProps) => (
  <img
    {...props}
    src={props.src || undefined}
    onError={e => (e.currentTarget.src = "/recording/images/clear.png")}
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
  const { currentUserInfo } = useContext(SessionContext);

  if (currentUserInfo && isFirstPlayer) {
    return <AuthAvatar user={currentUserInfo} />;
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
