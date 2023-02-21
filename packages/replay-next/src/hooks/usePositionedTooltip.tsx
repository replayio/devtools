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

import { MARGIN_LARGE, MARGIN_SMALL, TooltipPosition } from "./useTooltip";

// A copy-pasted version of the other `useTooltip` hook,
// but exposing `setShowTooltip` for control from the parent component
// instead of controlling display itself on hover.
// TODO Find a better way to consolidate these or extract common logic
export function usePositionedTooltip({
  className,
  containerRef,
  position,
  tooltip,
  targetRef,
}: {
  className?: string;
  containerRef?: RefObject<HTMLElement>;
  position: TooltipPosition;
  targetRef: RefObject<HTMLElement>;
  tooltip: ReactNode;
}): {
  setShowTooltip: Dispatch<SetStateAction<boolean>>;
  tooltip: ReactNode;
} {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [showTooltip, setShowTooltip] = useState(false);

  useLayoutEffect(() => {
    if (!targetRef.current || showTooltip === false) {
      return;
    }

    const tooltip = tooltipRef.current;
    if (tooltip === null) {
      return;
    }

    const mouseTarget = targetRef.current;

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
      }

      tooltip.style.setProperty("left", `${styleLeft}px`);
      tooltip.style.setProperty("top", `${styleTop}px`);
      tooltip.style.setProperty("margin-left", marginLeft);
      tooltip.style.setProperty("margin-top", marginTop);
    };

    const onScroll = () => {
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
  }, [containerRef, position, showTooltip, targetRef]);

  let renderedTooltip: ReactNode = null;
  if (showTooltip) {
    renderedTooltip = (
      <Tooltip className={className} ref={tooltipRef}>
        {tooltip}
      </Tooltip>
    );
  }

  return { tooltip: renderedTooltip, setShowTooltip };
}
