import assert from "assert";
import { useCallback, useLayoutEffect, useState } from "react";

import { findPointForLocation } from "replay-next/components/sources/utils/points";
import { PointBehaviorsObject } from "replay-next/src/contexts/points/types";
import { POINT_BEHAVIOR_DISABLED, POINT_BEHAVIOR_ENABLED, Point } from "shared/client/types";

import useClassListObserver from "../../../src/hooks/useClassListObserver";

const LINE_HEIGHTS = {
  large: 18,
  regular: 16,
};

type GetItemSize = (index: number) => number;

export default function useGetItemSize({
  availableWidth,
  pointBehaviors,
  pointsWithPendingEdits,
  sourceId,
}: {
  availableWidth: number;
  pointBehaviors: PointBehaviorsObject;
  pointsWithPendingEdits: Point[];
  sourceId: string;
}): [GetItemSize, lineHeight: number] {
  const [lineHeight, setLineHeight] = useState<number>(LINE_HEIGHTS.regular);
  const [measurements, setMeasurements] = useState<Map<number, number>>(new Map());

  // Listen for font-size changes.
  useClassListObserver(document.body.parentElement!, (classList: DOMTokenList) => {
    const prefersLargeFontSize = classList.contains("prefers-large-font-size");

    // HACK
    // We could swap this out for something that actually measures line height but it's probably not worth it.
    // Text and icons are vertically centered within the available line height so an approximation is fine.
    setLineHeight(prefersLargeFontSize ? LINE_HEIGHTS.large : LINE_HEIGHTS.regular);
  });

  useLayoutEffect(() => {
    const newMap = new Map();
    pointsWithPendingEdits.forEach(point => {
      // We could cache the most recent content+condition+width and only re-measure when they changed.
      // It's probably not worth it though, given how infrequently print statements are typically used.
      const height = measurePanelSize(sourceId, point.content, point.condition);

      newMap.set(point.location.line, height);
    });

    setMeasurements(newMap);
  }, [availableWidth, pointsWithPendingEdits, sourceId]);

  const getItemSize = useCallback(
    (index: number) => {
      const lineNumber = index + 1;
      const point = findPointForLocation(pointsWithPendingEdits, sourceId, lineNumber);
      if (!point) {
        // If the Point has been removed by some external action,
        // e.g. the Pause Information side panel,
        // Then ignore any cached Point state.
        return lineHeight;
      }

      const pointBehavior = pointBehaviors[point.key];
      // This Point might have been restored by a previous session.
      // In this case we should use its persisted values.
      // Else by default, shared print statements should be shown.
      // Points that have no content (breakpoints) should be hidden by default though.
      const shouldLog =
        pointBehavior?.shouldLog ??
        (point.content ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED);
      if (shouldLog !== POINT_BEHAVIOR_DISABLED) {
        return lineHeight + (measurements.get(lineNumber) ?? 0);
      }

      return lineHeight;
    },
    [lineHeight, measurements, pointBehaviors, pointsWithPendingEdits, sourceId]
  );

  return [getItemSize, lineHeight];
}

function measurePanelSize(sourceId: string, content: string, condition: string | null) {
  const root = document.querySelector(
    `[data-test-id="PointPanel-DoubleBuffer-${sourceId}"]`
  ) as HTMLElement;
  assert(root, "Print statement panel double buffer not found");

  const conditionalWrapperRow = root.querySelector(
    '[data-test-name="PointPanel-ConditionalWrapperRow"]'
  ) as HTMLElement;
  assert(conditionalWrapperRow, "Print statement conditional wrapper row not found");
  conditionalWrapperRow.style.display = condition != null ? "" : "none";

  const conditionElement = root.querySelector(
    '[data-test-name="PointPanel-Condition"]'
  ) as HTMLElement;
  assert(conditionElement, "Syntax highlighted condition element not found");
  conditionElement.textContent = condition ?? "";

  const contentElement = root.querySelector('[data-test-name="PointPanel-Content"]') as HTMLElement;
  assert(contentElement, "Syntax highlighted content element not found");
  contentElement.textContent = content;

  return root.clientHeight;
}
