import type { MouseEventHandler } from "react";
import { forwardRef, useRef, useState } from "react";
import classNames from "classnames";
import mergeRefs from "react-merge-refs";
import { Transition } from "react-transition-group";
import styled from "styled-components";

import { Icon } from "../Icon";

interface AddCommentButtonProps {
  /** Changes the button state to reflect the current active comment is paused on a hit. */
  isPausedOnHit?: boolean;

  /** Callback when button is clicked. */
  onClick?: MouseEventHandler<HTMLButtonElement>;

  /** Whether the button should submit a form or not. */
  type?: "button" | "submit";

  className?: string;
}

/**
 * Initiate adding a comment from a button.
 */
export const AddCommentButton = forwardRef<HTMLButtonElement, AddCommentButtonProps>(
  function AddCommentButton({ type, isPausedOnHit = false, onClick, className }, ref) {
    const localRef = useRef<HTMLButtonElement>(null);
    const mergedRefs = mergeRefs([localRef, ref]);
    const [isHovered, setIsHovered] = useState(false);
    const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maybeHover = () => {
      hoverRef.current = setTimeout(() => setIsHovered(true), 300);
    };
    const clearHover = () => {
      hoverRef.current && clearTimeout(hoverRef.current);
      setIsHovered(false);
    };

    return (
      <StyledButton
        ref={mergedRefs}
        type={type}
        aria-label="Add comment"
        onClick={onClick}
        onMouseEnter={maybeHover}
        onMouseLeave={clearHover}
        $isOpened={isHovered}
        $isPausedOnHit={isPausedOnHit}
        className={classNames(
          "font-sans font-medium outline-none focus-visible:ring-2 focus-visible:ring-primaryAccent focus-visible:ring-offset-2",
          className
        )}
      >
        <Icon name="comment-plus" fill="currentColor" />
        <TextFade visible={isHovered}>Add Comment</TextFade>
      </StyledButton>
    );
  }
);

const StyledButton = styled.button<{ $isOpened: boolean; $isPausedOnHit: boolean }>(
  {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    lineHeight: "1rem",
    fontSize: "0.75rem",
    height: 26,
    paddingLeft: 3,
    borderRadius: "3rem",
    color: "#fff",
    overflow: "hidden",
    transition: "width 180ms ease-out",

    svg: { flexShrink: 0 },
  },
  props => ({
    width: props.$isOpened ? 122 : 26,
    backgroundColor: props.$isPausedOnHit ? "var(--secondary-accent)" : "var(--primary-accent)",
  })
);

const duration = 100;

const states = {
  entering: { opacity: 0, transform: "scale(0.98)" },
  entered: { opacity: 1, transform: "scale(1)" },
  exiting: { opacity: 0, transform: "scale(0.98)" },
  exited: { display: "none", opacity: 0, transform: "scale(0.98)" },
  unmounted: { display: "none", opacity: 0, transform: "scale(0.98)" },
};

const StyledText = styled.span({
  whiteSpace: "nowrap",
  transition: `all ${duration}ms 40ms ease`,
  transform: "scale(0.98)",
  opacity: 0,
  margin: "0 0.5rem 0 0.25rem",
});

const TextFade = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
  <Transition in={visible} timeout={duration}>
    {state => <StyledText style={states[state]}>{children}</StyledText>}
  </Transition>
);
