import {
  Dispatch,
  MouseEvent,
  ReactNode,
  RefObject,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import Tooltip from "replay-next/components/Tooltip";
import useDebouncedCallback from "replay-next/src/hooks/useDebouncedCallback";

export type TooltipPosition = "above" | "below" | "left-of" | "right-of";

export const MARGIN_LARGE = 8;
export const MARGIN_SMALL = 4;

export default function useTooltip({
  className,
  containerRef,
  delay = 0,
  position,
  tooltip,
}: {
  className?: string;
  containerRef?: RefObject<HTMLElement>;
  delay?: number;
  position?: TooltipPosition;
  tooltip: ReactNode;
}): {
  onMouseEnter: (event: MouseEvent) => void;
  onMouseLeave: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  tooltip: ReactNode;
} {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [mouseCoordinates, setMouseCoordinates] = useState<Pick<
    MouseEvent,
    "clientX" | "clientY"
  > | null>(null);

  const [mouseTarget, setMouseTarget] = useState<HTMLElement | null>(null);

  const [showTooltip, setShowTooltip] = useState(false);

  const setShowTooltipDebounced = useDebouncedCallback((value: boolean) => {
    setShowTooltip(value);
  }, delay);

  useLayoutEffect(() => {
    if (mouseCoordinates === null || mouseTarget === null || showTooltip === false) {
      return;
    }

    const tooltip = tooltipRef.current;
    if (tooltip === null) {
      return;
    }

    const container = containerRef?.current ?? document.body;

    const reposition = () => {
      // Use clientWidth and clientHeight rather than bounding rect
      // because these values take CSS transforms into account
      // and the tooltip uses "transform: scale" to appear
      // and this CSS animation does not trigger ResizeObserver callbacks.
      const tooltipHeight = tooltip.clientHeight;
      const tooltipWidth = tooltip.clientWidth;

      let marginLeft: string | null = null;
      let marginTop: string | null = null;
      let styleLeft: number | null = null;
      let styleTop: number | null = null;

      if (position) {
        const targetRect = mouseTarget.getBoundingClientRect();

        styleLeft = targetRect.left + mouseTarget.offsetWidth / 2 - tooltipWidth / 2;
        styleTop = targetRect.top + mouseTarget.offsetHeight / 2 - tooltipHeight / 2;

        switch (position) {
          case "above":
            styleTop = targetRect.top - tooltipHeight - MARGIN_SMALL;
            break;
          case "below":
            styleTop = targetRect.top + mouseTarget.offsetHeight + MARGIN_SMALL;
            break;
          case "left-of":
            styleLeft = targetRect.left - tooltipWidth - MARGIN_SMALL;
            break;
          case "right-of":
            styleLeft = targetRect.left + mouseTarget.offsetWidth + MARGIN_SMALL;
            break;
        }
      } else {
        styleLeft = mouseCoordinates.clientX + MARGIN_LARGE;
        styleTop = mouseCoordinates.clientY + MARGIN_LARGE;

        // For the target we intentionally use the bounding rect (rather than clientWidth/clientHeight)
        // because this takes scale into consideration, which is important for targets like HTMLCanvasElements.
        const containerRect = container.getBoundingClientRect();
        if (styleLeft + tooltipWidth + MARGIN_LARGE > containerRect.left + containerRect.width) {
          marginLeft = `-${tooltipWidth + MARGIN_LARGE * 2}px`;
        }
        if (styleTop + tooltipHeight + MARGIN_LARGE > containerRect.top + containerRect.height) {
          marginTop = `-${tooltipHeight + MARGIN_LARGE * 2}px`;
        }
      }

      tooltip.style.setProperty("left", `${styleLeft}px`);
      tooltip.style.setProperty("top", `${styleTop}px`);
      tooltip.style.setProperty("margin-left", marginLeft);
      tooltip.style.setProperty("margin-top", marginTop);
    };

    const onScroll = () => {
      setMouseCoordinates(null);
      setMouseTarget(null);
      setShowTooltip(false);
    };

    // Any scrolling should hide the tooltip.
    // We could try to reposition but it's probably a better experience to just hide on scroll.
    const scrollTargets: HTMLElement[] = [];
    let currentTarget: HTMLElement | null = mouseTarget;
    while (currentTarget != null) {
      scrollTargets.push(currentTarget);
      currentTarget.addEventListener("scroll", onScroll);
      currentTarget = currentTarget.parentElement || null;
    }

    const observer = new ResizeObserver(reposition);
    container && observer.observe(container);
    observer.observe(tooltip);
    observer.observe(mouseTarget);

    reposition();

    return () => {
      scrollTargets.forEach(target => {
        target.removeEventListener("scroll", onScroll);
      });

      observer.unobserve(container);
      observer.unobserve(tooltip);
      observer.unobserve(mouseTarget);
      observer.disconnect();
    };
  }, [containerRef, mouseCoordinates, mouseTarget, position, showTooltip]);

  let renderedTooltip: ReactNode = null;
  if (showTooltip) {
    renderedTooltip = (
      <Tooltip className={className} ref={tooltipRef}>
        {tooltip}
      </Tooltip>
    );
  }

  const onMouseEnter = (event: MouseEvent) => {
    setMouseCoordinates({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    setMouseTarget(event.currentTarget as HTMLElement);

    if (delay === 0) {
      setShowTooltip(true);
    } else {
      setShowTooltipDebounced(true);
    }
  };

  const onMouseLeave = (event: MouseEvent) => {
    setMouseCoordinates(null);
    setMouseTarget(null);
    setShowTooltip(false);
    setShowTooltipDebounced.cancel();
  };

  const onMouseMove = (event: MouseEvent) => {
    if (position) {
      return;
    }

    setMouseCoordinates({
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  return { onMouseEnter, onMouseLeave, onMouseMove, tooltip: renderedTooltip };
}
