import { Nag } from "ui/hooks/users";

export function getAvatarColor(avatarID?: number) {
  if (!avatarID) {
    return "#696969";
  }
  const avatarColors = ["#2D4551", "#509A8F", "#E4C478", "#E9A56C", "#D97559"];
  return avatarColors[avatarID % avatarColors.length];
}

export function shouldShowNag(nags: Nag[], key: Nag) {
  return nags && !nags.includes(key);
}
