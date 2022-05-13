/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { PrefixBadge } from "ui/components/PrefixBadge";

const levels = {
  debug: "Debug",
  error: "Error",
  info: "Info",
  log: "Log",
  warn: "Warn",
};

// Store common icons so they can be used without recreating the element
// during render.
const CONSTANT_ICONS = Object.entries(levels).reduce((acc, [key, l10nLabel]) => {
  acc[key] = getIconElement(l10nLabel);
  return acc;
}, {});

function getIconElement(level, onRewindClick, type) {
  let title = levels[level] || level;
  const classnames = ["icon"];

  if (type === "paywall") {
    classnames.push("material-icons");
  }

  {
    return <span className={classnames.join(" ")} title={title} aria-live="off" />;
  }
}

export function MessageIcon(props) {
  const { level, onRewindClick, type, prefixBadge } = props;

  if (onRewindClick) {
    return getIconElement(level, onRewindClick, type);
  }

  if (prefixBadge) {
    return <PrefixBadge prefixBadge={prefixBadge} />;
  }

  if (type) {
    return getIconElement(level, null, type);
  }

  return CONSTANT_ICONS[level] || getIconElement(level);
}
