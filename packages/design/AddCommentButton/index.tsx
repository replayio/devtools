import classNames from "classnames";
import type { MouseEventHandler } from "react";
import { forwardRef, useRef, useState, useEffect } from "react";
import mergeRefs from "react-merge-refs";
import { Transition } from "react-transition-group";

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

    useEffect(() => {
      return () => {
        clearTimeout(hoverRef.current);
      };
    }, []);

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

// Duration must match `transition` rule in module.css file
const duration = 100;

const states = {
  entering: { opacity: 0, transform: "scale(0.98)" },
  entered: { opacity: 1, transform: "scale(1)" },
  exiting: { opacity: 0, transform: "scale(0.98)" },
  exited: { display: "none", opacity: 0, transform: "scale(0.98)" },
  unmounted: { display: "none", opacity: 0, transform: "scale(0.98)" },
};

const TextFade = ({ children, visible }: { children: React.ReactNode; visible: boolean }) => (
  <Transition in={visible} timeout={duration}>
    {state => (
      <span className={styles.TextFade} style={states[state]}>
        {children}
      </span>
    )}
  </Transition>
);
