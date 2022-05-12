import type { ComponentProps, MouseEventHandler } from "react";
import { forwardRef, useRef, useState } from "react";
import mergeRefs from "react-merge-refs";
import { Transition } from "react-transition-group";
import styled from "styled-components";

interface AddCommentButtonProps {
  /** Changes the button state to reflect the current active comment is paused on a hit. */
  isPausedOnHit?: boolean;

  /** Callback when button is clicked. */
  onClick?: MouseEventHandler<HTMLButtonElement>;

  /** Whether the button should submit a form or not. */
  type?: "button" | "submit";
}

/** Initiate adding a comment from anywhere in the application. */
export const AddCommentButton = forwardRef<HTMLButtonElement, AddCommentButtonProps>(
  function AddCommentButton({ type, isPausedOnHit = false, onClick }, ref) {
    const localRef = useRef<HTMLButtonElement>(null);
    const mergedRefs = mergeRefs([localRef, ref]);
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isOpened = isFocused || isHovered;

    return (
      <StyledButton
        ref={mergedRefs}
        type={type}
        aria-label="Add comment"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        $isOpened={isOpened}
        $isPausedOnHit={isPausedOnHit}
      >
        <CommentPlusIcon />
        <TextFade visible={isOpened}>Add Comment</TextFade>
      </StyledButton>
    );
  }
);

const CommentPlusIcon = (props: ComponentProps<"svg">) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M6.56043 17.4922C6.71015 17.4922 6.84918 17.458 6.9775 17.3895C7.11011 17.3211 7.26624 17.2077 7.44591 17.0495L9.87132 14.8871L13.8559 14.8935C14.5104 14.8935 15.0729 14.7673 15.5435 14.515C16.014 14.2583 16.3733 13.8947 16.6214 13.4242C16.8738 12.9536 17 12.3932 17 11.743V6.66122C17 6.01102 16.8738 5.45065 16.6214 4.98011C16.3733 4.50957 16.014 4.14811 15.5435 3.89573C15.0729 3.63907 14.5104 3.51074 13.8559 3.51074H5.80971C5.15523 3.51074 4.59272 3.63907 4.12218 3.89573C3.65592 4.14811 3.2966 4.50957 3.04422 4.98011C2.79184 5.45065 2.66565 6.01102 2.66565 6.66122V11.743C2.66565 12.3932 2.79398 12.9536 3.05064 13.4242C3.31157 13.8947 3.66875 14.2562 4.12218 14.5085C4.57989 14.7609 5.10604 14.8871 5.70063 14.8871H5.88029V16.735C5.88029 16.966 5.94018 17.15 6.05995 17.2869C6.184 17.4237 6.35083 17.4922 6.56043 17.4922ZM6.69518 9.20213C6.69518 8.9797 6.76576 8.7979 6.90692 8.65674C7.05236 8.5113 7.23202 8.43858 7.44591 8.43858H9.08852V6.79597C9.08852 6.58208 9.1591 6.40456 9.30026 6.2634C9.44142 6.11796 9.62108 6.04524 9.83924 6.04524C10.0574 6.04524 10.2371 6.11796 10.3782 6.2634C10.5237 6.40456 10.5964 6.58208 10.5964 6.79597V8.43858H12.2454C12.4593 8.43858 12.6368 8.5113 12.778 8.65674C12.9191 8.7979 12.9897 8.9797 12.9897 9.20213C12.9897 9.41602 12.9191 9.59568 12.778 9.74112C12.6368 9.88228 12.4593 9.95286 12.2454 9.95286H10.5964V11.5955C10.5964 11.8094 10.5237 11.9869 10.3782 12.128C10.2371 12.2692 10.0574 12.3398 9.83924 12.3398C9.62108 12.3398 9.44142 12.2692 9.30026 12.128C9.1591 11.9869 9.08852 11.8094 9.08852 11.5955V9.95286H7.44591C7.23202 9.95286 7.05236 9.88228 6.90692 9.74112C6.76576 9.59568 6.69518 9.41602 6.69518 9.20213Z" />
  </svg>
);

const StyledButton = styled.button<{ $isOpened: boolean; $isPausedOnHit: boolean }>(
  {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    lineHeight: "1rem",
    fontWeight: 700,
    fontSize: "0.625rem",
    height: 20,
    paddingLeft: 3,
    borderRadius: "2rem",
    color: "#fff",
    overflow: "hidden",
    transition: "width 180ms ease-out",

    svg: { flexShrink: 0 },
  },
  props => ({
    width: props.$isOpened ? 100 : 20,
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
