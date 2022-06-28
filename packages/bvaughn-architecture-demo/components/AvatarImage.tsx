import { ImgHTMLAttributes } from "react";

export default function AvatarImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // The user image URLs that we get from Google sometimes fail to load, in that case
  // we fall back to a transparent image (instead of showing the browser's icon for broken images)
  const onError = ({ currentTarget }: any) => {
    currentTarget.src = "/avatar-fallback.png";
  };

  return <img data-private {...props} onError={onError} />;
}
