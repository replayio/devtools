import type { ComponentProps, MouseEventHandler } from "react";
import { forwardRef, useRef, useState } from "react";
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
}

/**
 * Initiate adding a comment from a button.
 */
export const AddCommentButton = forwardRef<HTMLButtonElement, AddCommentButtonProps>(
  function AddCommentButton({ type, isPausedOnHit = false, onClick }, ref) {
    const localRef = useRef<HTMLButtonElement>(null);
    const mergedRefs = mergeRefs([localRef, ref]);
    const [isHovered, setIsHovered] = useState(false);
    const isOpened = isHovered;

    return (
      <StyledButton
        ref={mergedRefs}
        type={type}
        aria-label="Add comment"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        $isOpened={isOpened}
        $isPausedOnHit={isPausedOnHit}
        className="focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
      >
        <Icon name="comment-plus" fill="currentColor" />
        <TextFade visible={isOpened}>Add Comment</TextFade>
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
    fontWeight: 700,
    fontSize: "0.625rem",
    height: 26,
    paddingLeft: 3,
    borderRadius: "3rem",
    color: "#fff",
    overflow: "hidden",
    transition: "width 180ms ease-out",

    svg: { flexShrink: 0 },
  },
  props => ({
    width: props.$isOpened ? 106 : 26,
    backgroundColor: props.$isPausedOnHit ? "var(--secondary-accent)" : "var(--primary-accent)",
  })
);

const duration = 120;

const states = {
  entering: { opacity: 0, transform: "scale(0.98)" },
  entered: { opacity: 1, transform: "scale(1)" },
  exiting: { opacity: 0, transform: "scale(0.98)" },
  exited: { display: "none", opacity: 0, transform: "scale(0.98)" },
  unmounted: { display: "none", opacity: 0, transform: "scale(0.98)" },
};

const StyledText = styled.span({
  whiteSpace: "nowrap",
  transition: `all ${duration}ms 40ms ease-out`,
  transform: "scale(0.98)",
  opacity: 0,
  margin: "0 0.25rem",
});

const TextFade = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
  <Transition in={visible} timeout={duration}>
    {state => <StyledText style={states[state]}>{children}</StyledText>}
  </Transition>
);
