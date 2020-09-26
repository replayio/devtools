import dom from "react-dom-factories";
import classnames from "classnames";
import { SVG } from "image/svg";
import { LocalizationHelper } from "devtools/shared/l10n";

const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");

export default function CommandButton({ img, className, onClick, active }) {
  const images = {
    next: SVG.NextButton,
    previous: SVG.NextButton,
    pause: SVG.ReplayPause,
    play: SVG.ReplayResume,
    comment: SVG.Comment,
  };

  const attrs = {
    className: classnames(`command-button`, { active }),
    onClick,
  };

  attrs.title = L10N.getStr(`toolbox.replay.${img}`);

  const base64 = btoa(images[img]);

  return dom.div(
    attrs,
    dom.div({
      className: `btn ${img} ${className}`,
      style: {
        WebkitMaskImage: `url("data:image/svg+xml;base64,${base64}")`,
        maskImage: `url("data:image/svg+xml;base64,${base64}")`,
      },
    })
  );
}
