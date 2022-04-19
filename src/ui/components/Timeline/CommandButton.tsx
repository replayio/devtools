import classnames from "classnames";
import { SVG } from "image/svg";
import React, { MouseEventHandler } from "react";

const { LocalizationHelper } = require("devtools/shared/l10n");

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");

const images = {
  comment: SVG.Comment,
  next: SVG.NextButton,
  pause: SVG.ReplayPause,
  play: SVG.ReplayResume,
  previous: SVG.NextButton,
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
    title: L10N.getStr(`toolbox.replay.${img}`),
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
