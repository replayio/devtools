import { CSSProperties } from "react";

import { Badge } from "shared/client/types";

export function getBadgeStyleVars(badge: Badge | null): CSSProperties {
  const badgeName = badge || "default";
  return {
    "--badge-background-color": `var(--badge-${badgeName}-color)`,
    "--badge-color": `var(--badge-${badgeName}-contrast-color)`,
  } as CSSProperties;
}
