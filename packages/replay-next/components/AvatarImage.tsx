import { ImgHTMLAttributes, useState } from "react";

import styles from "./AvatarImage.module.css";

type Props = {
  name?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

export default function AvatarImage({ className, name, src, title, ...rest }: Props) {
  const [source, setSource] = useState(src);
  const [showNameBadge, setShowNameBadge] = useState(name && !src);

  // If the user has no image, their initials can be shown as a fallback.
  if (name && showNameBadge) {
    const initials = name
      .split(" ")
      .map(n => n.charAt(0))
      .join("");
    return (
      <div className={`${styles.Name} ${className}`} title={title || name}>
        {initials}
      </div>
    );
  }

  // If a user image fails to load, show a fallback.
  const onError = ({ currentTarget }: any) => {
    if (name) {
      setShowNameBadge(true);
    } else {
      setSource("/images/avatar-fallback.png");
    }
  };

  return (
    <img
      {...rest}
      className={`${styles.Image} ${className}`}
      data-private
      onError={onError}
      src={source}
      title={title || name}
    />
  );
}
