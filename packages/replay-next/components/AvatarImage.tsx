import { ImgHTMLAttributes, useState } from "react";

import useTooltip from "replay-next/src/hooks/useTooltip";

import styles from "./AvatarImage.module.css";

type Props = {
  name?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

export default function AvatarImage({ className, name, src, title, ...rest }: Props) {
  const [source, setSource] = useState(src);
  const [showNameBadge, setShowNameBadge] = useState(name && !src);

  const tooltipOrTitle = title ?? name ?? "";

  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    position: "above",
    tooltip: tooltipOrTitle,
  });

  // If the user has no image, their initials can be shown as a fallback.
  if (name && showNameBadge) {
    const initials = name
      .split(" ")
      .map(n => n.charAt(0))
      .join("");

    return (
      <div className={`${styles.Name} ${className}`} title={tooltipOrTitle}>
        {initials}
      </div>
    );
  }

  // If a user image fails to load, show a fallback.
  const onError = () => {
    if (name) {
      setShowNameBadge(true);
    } else {
      setSource("/recording/images/avatar-fallback.png");
    }
  };

  return (
    <>
      <img
        {...rest}
        className={`${styles.Image} ${className}`}
        onError={onError}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        src={source}
      />
      {tooltip}
    </>
  );
}
