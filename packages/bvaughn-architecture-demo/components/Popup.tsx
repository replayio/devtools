import { MouseEvent, ReactNode, RefObject, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./Popup.module.css";

const MOUSE_LEAVE_DEBOUNCE_TIMER = 250;
const RESIZE_DEBOUNCE_TIMER = 100;

type Dismiss = () => void;

export default function Popup({
  children,
  containerRef = null,
  dataTestId,
  dataTestName = "Popup",
  dismiss,
  dismissOnMouseLeave = false,
  showTail = false,
  target,
}: {
  children: ReactNode;
  containerRef?: RefObject<HTMLElement> | null;
  dataTestId?: string;
  dataTestName?: string;
  dismiss: Dismiss;
  dismissOnMouseLeave?: boolean;
  showTail?: boolean;
  target: HTMLElement;
}) {
  const arrowRef = useRef<SVGElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const dismissStateRef = useRef<{
    dismiss: Dismiss;
    dismissOnMouseLeave: boolean;
  }>({
    dismiss: dismiss || null,
    dismissOnMouseLeave,
  });

  useLayoutEffect(() => {
    const dismissState = dismissStateRef.current;
    dismissState.dismiss = dismiss;
    dismissState.dismissOnMouseLeave = dismissOnMouseLeave;
  }, [dismiss, dismissOnMouseLeave]);

  useLayoutEffect(() => {
    const arrow = arrowRef.current!;
    const container = containerRef?.current || document.body;
    const popover = popoverRef.current!;

    let ignoreMouseLeaveEvents: boolean = false;
    let ignoreMouseLeaveEventTimeout: NodeJS.Timeout | null = null;

    const clearMouseLeaveTimeout = () => {
      if (ignoreMouseLeaveEventTimeout) {
        clearTimeout(ignoreMouseLeaveEventTimeout);
      }
      ignoreMouseLeaveEventTimeout = null;
    };

    const onMouseLeave = () => {
      if (ignoreMouseLeaveEvents) {
        return;
      }

      const { dismiss, dismissOnMouseLeave } = dismissStateRef.current;
      if (dismissOnMouseLeave) {
        clearMouseLeaveTimeout();

        ignoreMouseLeaveEventTimeout = setTimeout(() => {
          ignoreMouseLeaveEventTimeout = null;
          dismiss();
        }, MOUSE_LEAVE_DEBOUNCE_TIMER);
      }
    };

    const onScroll = () => {
      const { dismiss } = dismissStateRef.current;
      dismiss();
    };

    const reposition = () => {
      arrow.style.setProperty("display", showTail ? "block" : "none");

      const containerRect = container.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      let arrowUp = true;

      // Vertical alignment: Determined entirely by the target location within the parent container.
      // Targets in the top half of the container have popups displayed beneath them,
      // and targets in the bottom half of the container have popups displayed above them.
      //
      // The reason we do this, rather than based on the size of the content in the popup,
      // is that the popup content sizes may change as the user interacts (e.g. clicks to expand and inspect a node)
      // and it's jarring for the popup to jump around the screen in response to a user action.
      if (targetRect.top + targetRect.height / 2 < containerRect.top + containerRect.height / 2) {
        const popoverTop = targetRect.top + targetRect.height;
        popover.style.setProperty("top", `${popoverTop}px`);

        arrow.setAttribute("class", styles.UpArrow);
      } else {
        const popoverTop = targetRect.top - popoverRect.height;
        popover.style.setProperty("top", `${popoverTop}px`);

        arrow.setAttribute("class", styles.DownArrow);

        arrowUp = false;
      }

      // TODO
      // Handle horizontal positioning edge case if popup is outside of scroll area when rendered initially.

      // Horizontal alignment: Prefer horizontally centered around the target
      // But don't go outside of the bounds of the container.
      const popoverLeftMin = containerRect.left;
      const popoverLeftMax = containerRect.left + containerRect.width - popoverRect.width;
      const popoverLeftPreferred = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
      const popoverLeft = Math.max(popoverLeftMin, Math.min(popoverLeftMax, popoverLeftPreferred));
      popover.style.setProperty("left", `${popoverLeft}px`);

      // Arrow alignment: Prefer horizontally centered around the target
      // But keep away from the extreme edges of the popover to account for rounded corners.
      const arrowRect = arrow.getBoundingClientRect();
      const arrowLeftMin = targetRect.left;
      const arrowLeftMax = targetRect.left + targetRect.width - arrowRect.width;
      const arrowLeftPreferred = targetRect.left + targetRect.width / 2 - arrowRect.width / 2;
      const arrowLeft = Math.max(arrowLeftMin, Math.min(arrowLeftMax, arrowLeftPreferred));
      arrow.style.setProperty("margin-left", `${arrowLeft - popoverLeft}px`);

      // Ignore "mouseleave" events that occur right after resize.
      // They may be false positives, caused by the popover content moving.
      clearMouseLeaveTimeout();
      ignoreMouseLeaveEvents = true;
      ignoreMouseLeaveEventTimeout = setTimeout(() => {
        ignoreMouseLeaveEvents = false;
        ignoreMouseLeaveEventTimeout = null;
      }, RESIZE_DEBOUNCE_TIMER);
    };

    const onMouseEnter = () => {
      clearMouseLeaveTimeout();
    };

    // Any scrolling should hide the popup.
    // We could try to reposition but it's probably a better experience to just hide on scroll.
    const scrollTargets: HTMLElement[] = [];
    let currentTarget: HTMLElement | null = target;
    while (currentTarget != null) {
      scrollTargets.push(currentTarget);
      currentTarget.addEventListener("scroll", onScroll);
      currentTarget = currentTarget.parentElement || null;
    }

    popover.addEventListener("mouseenter", onMouseEnter);
    popover.addEventListener("mouseleave", onMouseLeave);

    const observer = new ResizeObserver(reposition);
    observer.observe(container);
    observer.observe(popover);
    observer.observe(target);

    return () => {
      scrollTargets.forEach(target => {
        target.removeEventListener("scroll", onScroll);
      });

      popover.removeEventListener("mouseenter", onMouseEnter);
      popover.removeEventListener("mouseleave", onMouseLeave);

      observer.unobserve(container);
      observer.unobserve(popover);
      observer.unobserve(target);
      observer.disconnect();

      clearMouseLeaveTimeout();
    };
  }, [containerRef, showTail, target]);

  const blockEvent = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={styles.Popup}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      onClick={blockEvent}
      ref={popoverRef}
    >
      <svg ref={arrowRef as any} viewBox="0 0 16 8" preserveAspectRatio="none">
        <polygon className={styles.ArrowBackground} points="8,0 16,8 0,8"></polygon>
        <polygon className={styles.ArrowForeground} points="8,1 15,8 1,8"></polygon>
      </svg>
      {children}
    </div>,
    document.body
  );
}
