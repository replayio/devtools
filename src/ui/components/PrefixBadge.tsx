import React, { useCallback, useContext } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { PrefixBadgePicker } from "design";
import { Badge, Point } from "shared/client/types";

import styles from "./PrefixBadge.module.css";

// Rendered in log point PanelEditor, when a log point is being edited.
// Clicking this item will show the PrefixBadgePicker.
export default function PrefixBadgeButton({ point }: { point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const { id } = point;
  const onSelect = useCallback(
    (newBadge: Badge | undefined) => {
      editPoint(id, { badge: newBadge || null });
    },
    [editPoint, id]
  );

  return <PrefixBadgePicker initialValue={point.badge || undefined} onSelect={onSelect} />;
}

// Helper method used by the log point PanelEditor, when a log point is being viewed.
// This ensures the point count has a background color that matches the selected badge.
export function getPrefixBadgeBackgroundColorClassName(prefixBadge?: Badge) {
  return prefixBadge === "unicorn"
    ? styles.unicorn
    : prefixBadge == null
    ? ""
    : styles[prefixBadge];
}
