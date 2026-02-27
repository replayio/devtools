import classNames from "classnames";
import type { MouseEventHandler } from "react";
import { forwardRef, useRef, useState } from "react";
import mergeRefs from "react-merge-refs";

import { Icon } from "design/Icon";

import styles from "./AddCommentButton.module.css";

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

    const buttonClassnames = classNames(
      "font-sans font-medium outline-none focus-visible:ring-2 focus-visible:ring-primaryAccent focus-visible:ring-offset-2",
      styles.AddCommentButton,
      {
        [styles.isOpened]: isHovered,
        [styles.isPausedOnHit]: isPausedOnHit,
      },
      className
    );

    return (
      <div className={styles.Root}>
        <button
          ref={mergedRefs}
          type={type}
          aria-label="Add comment"
          onClick={onClick}
          onMouseEnter={maybeHover}
          onMouseLeave={clearHover}
          className={buttonClassnames}
        >
          <Icon name="comment-plus" className={styles.Icon} />
          <TextFade visible={isHovered}>Add Comment</TextFade>
        </button>
      </div>
    );
  }
);

const TextFade = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
  <span
    className={styles.TextFade}
    style={
      visible
        ? { opacity: 1, transform: "scale(1)" }
        : { display: "none", opacity: 0, transform: "scale(0.98)" }
    }
  >
    {children}
  </span>
);
