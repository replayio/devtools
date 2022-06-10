/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MessagePrefixBadge } from "ui/components/PrefixBadge";
import type { PrefixBadge } from "devtools/client/debugger/src/reducers/types";
import React from "react";

const levels = {
  debug: "Debug",
  error: "Error",
  info: "Info",
  log: "Log",
  warn: "Warn",
} as const;

// Store common icons so they can be used without recreating the element
// during render.
const CONSTANT_ICONS = Object.entries(levels).reduce((acc, [key, l10nLabel]) => {
  // @ts-expect-error key/value mismatch
  acc[key] = getIconElement(l10nLabel);
  return acc;
}, {} as Record<string, React.ReactNode>);

function getIconElement(level: keyof typeof levels, type?: string) {
  let title = levels[level] || level;
  const classnames = ["icon"];

  if (type === "paywall") {
    classnames.push("material-icons");
  }

  {
    return <span className={classnames.join(" ")} title={title} aria-live="off" />;
  }
}

interface MessageIconProps {
  level: keyof typeof levels;
  type: string;
  prefixBadge?: PrefixBadge;
}

export function MessageIcon(props: MessageIconProps) {
  const { level, type, prefixBadge } = props;

  if (prefixBadge) {
    return <MessagePrefixBadge prefixBadge={prefixBadge} />;
  }

  if (type) {
    return getIconElement(level, type);
  }

  return CONSTANT_ICONS[level] || getIconElement(level);
}
