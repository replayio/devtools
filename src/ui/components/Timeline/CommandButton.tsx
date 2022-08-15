import React, { MouseEventHandler } from "react";
import { SVG } from "image/svg";
import classnames from "classnames";
const { LocalizationHelper } = require("devtools/shared/l10n");

const images = {
  next: SVG.NextButton,
  previous: SVG.NextButton,
  pause: SVG.ReplayPause,
  play: SVG.ReplayResume,
  comment: SVG.Comment,
};

const buttonTitles: Record<keyof typeof images, string> = {
  next: "Next Frame",
  previous: "Previous Frame",
  pause: "Pause",
  play: "Play Recording",
  comment: "Add Comment",
};

interface CommandButtonProps {
  img: keyof typeof images;
  className: string;
  onClick: MouseEventHandler;
  active: boolean;
}

export default function CommandButton({ img, className, onClick, active }: CommandButtonProps) {
  const attrs = {
    className: classnames(`command-button`, { active }),
    onClick,
    title: buttonTitles[img],
  };

  const base64 = btoa(images[img]);

  return (
    <div {...attrs}>
      <div
        className={`btn ${img} ${className}`}
        style={{
          WebkitMaskImage: `url("data:image/svg+xml;base64,${base64}")`,
          maskImage: `url("data:image/svg+xml;base64,${base64}")`,
        }}
      />
    </div>
  );
}
