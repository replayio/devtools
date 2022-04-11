import { useCallback, useLayoutEffect, useRef, useState } from "react";

const TOOLTIP_OFFSET_BOTTOM = 10;
const TOOLTIP_OFFSET_TOP = 5;

type Coordinates = {
  pageX: number;
  pageY: number;
};

type Elements = {
  container: HTMLElement | null;
  tooltip: HTMLDivElement | null;
};

type TooltipProps = {
  label: string;
  targetID?: string;
};

export default function Tooltip({ label, targetID }: TooltipProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const elementsRef = useRef<Elements>({
    container: null,
    tooltip: null,
  });

  const tooltipRefSetter = useCallback((tooltip: HTMLDivElement | null) => {
    const elements = elementsRef.current;
    elements.tooltip = tooltip;
    if (tooltip == null) {
      elements.container = null;
    } else {
      elements.container = findPositionedParent(tooltip);
    }
  }, []);

  // Window event listeners only need to run on mount/unmount.
  useLayoutEffect(() => {
    const target = targetID ? document.getElementById(targetID) : window;
    if (target) {
      const onMouseLeave = () => {
        setCoordinates(null);
      };
      const onMouseMove = (event: MouseEvent) => {
        setCoordinates({ pageX: event.pageX, pageY: event.pageY });
      };

      target.addEventListener("mouseleave", onMouseLeave);
      target.addEventListener("mousemove", onMouseMove as (e: Event) => void);
      return () => {
        target.removeEventListener("mouseleave", onMouseLeave);
        target.removeEventListener("mousemove", onMouseMove as (e: Event) => void);
      };
    }
  }, [targetID]);

  // Positioning logic runs after each render.
  // It needs to account for changes in coordinates or tooltip content/size.
  useLayoutEffect(() => {
    const container = elementsRef.current.container;
    const tooltip = elementsRef.current.tooltip;
    if (coordinates !== null && tooltip !== null) {
      positionTooltip(tooltip, container, coordinates);
    }
  });

  if (coordinates === null) {
    return null;
  }

  return (
    <div
      ref={tooltipRefSetter}
      className="absolute flex w-max items-center space-x-1.5 rounded-2xl bg-black bg-opacity-70 px-2.5 py-1 text-xs text-white"
    >
      {label}
    </div>
  );
}

function findPositionedParent(tooltip: HTMLDivElement): HTMLElement | null {
  let parentElement = tooltip.parentElement;
  while (parentElement != null) {
    const position = window.getComputedStyle(parentElement).position;
    switch (position) {
      case "absolute":
      case "relative":
      case "sticky":
        return parentElement;
    }

    parentElement = parentElement.parentElement;
  }
  return null;
}

function positionTooltip(
  tooltip: HTMLDivElement,
  container: HTMLElement | null,
  coordinates: Coordinates
) {
  const { pageX, pageY } = coordinates;

  let x = pageX;
  let y = pageY;
  if (container !== null) {
    const bounds = container.getBoundingClientRect();
    x -= bounds.left;
    y -= bounds.top;
  }

  const height = container ? container.offsetHeight : window.innerHeight;
  const width = container ? container.offsetWidth : window.innerWidth;

  if (y + TOOLTIP_OFFSET_BOTTOM + tooltip.offsetHeight >= height) {
    // The tooltip doesn't fit below the mouse cursor (which is our default strategy).
    if (y - TOOLTIP_OFFSET_TOP - tooltip.offsetHeight > 0) {
      // We position the tooltip above the mouse cursor if it fits there.
      tooltip.style.top = `${y - tooltip.offsetHeight - TOOLTIP_OFFSET_TOP}px`;
    } else {
      // Otherwise we align the tooltip with the window's top edge.
      tooltip.style.top = "0px";
    }
  } else {
    tooltip.style.top = `${y + TOOLTIP_OFFSET_BOTTOM}px`;
  }

  if (x + TOOLTIP_OFFSET_BOTTOM + tooltip.offsetWidth >= width) {
    // The tooltip doesn't fit at the right of the mouse cursor (which is our default strategy).
    if (x - TOOLTIP_OFFSET_TOP - tooltip.offsetWidth > 0) {
      // We position the tooltip at the left of the mouse cursor if it fits there.
      tooltip.style.left = `${x - tooltip.offsetWidth - TOOLTIP_OFFSET_TOP}px`;
    } else {
      // Otherwise, align the tooltip with the window's left edge.
      tooltip.style.left = "0px";
    }
  } else {
    tooltip.style.left = `${x + TOOLTIP_OFFSET_BOTTOM}px`;
  }
}
