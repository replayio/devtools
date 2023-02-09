import classNames from "classnames";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode, useEffect } from "react";
import { Children, cloneElement, isValidElement, useRef, useState } from "react";

import styles from "./Picker.module.css";

export function Picker<Values extends any>({
  value,
  onChange,
  children,
  backgroundColor,
  ...props
}: {
  value: Values;
  onChange: (value: Values) => void;
  children: ReactNode;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const timeOutID: any = useRef(null);
  const previousId = useRef(null);
  const transitioning = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const transition = {
    duration: isOpen ? 0.16 : 0.2,
    opacity: { duration: isOpen ? 0.1 : 0.04 },
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeOutID.current);
    };
  }, []);

  return (
    <motion.div
      {...props}
      data-open={isOpen}
      className={classNames(styles.Picker, props.className)}
      title={isOpen ? undefined : "Select a prefix badge"}
      initial={isOpen ? "opened" : "closed"}
      animate={isOpen ? "opened" : "closed"}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => !isOpen && !transitioning.current && setIsActive(false)}
      variants={{
        opened: {
          transition: {
            staggerChildren: 0.02,
          },
        },
        closed: {
          transition: {
            staggerChildren: 0.02,
          },
        },
      }}
    >
      <motion.div
        layout
        transition={transition}
        className={styles.PickerFill}
        style={{
          borderRadius: 32,
          backgroundColor: isActive ? "var(--badge-background--active)" : "var(--badge-background)",
        }}
      />
      {Children.toArray(children).map(child => {
        if (!isValidElement(child)) {
          throw Error("Picker children must be a valid React element.");
        }

        if (!child.props.id) {
          const name = typeof child.type === "string" ? child.type : child.type.name;
          throw Error(`Immediate Picker child "${name}" must pass an "id" prop.`);
        }

        const isToggle = child.props.id === "toggle";
        const showToggle = value === undefined && isToggle;
        const isChildActive = value === child.props.id || showToggle;
        const wasChildActive = previousId.current === child.props.id;
        const childVariants = child.props.variants || {};
        const onSelect = () => {
          const nextIsOpen = !isOpen;

          setIsOpen(nextIsOpen);

          if (nextIsOpen) {
            setIsActive(true);
          } else {
            /** Wait until the fill is finished animating before removing the active background color. */
            timeOutID.current = setTimeout(() => {
              setIsActive(false);
              transitioning.current = false;
            }, transition.duration * 1000);

            transitioning.current = true;
          }

          const nextActiveId = isToggle ? undefined : child.props.id;

          previousId.current = isChildActive ? child.props.id : undefined;

          onChange(nextActiveId);
        };

        return cloneElement(child, {
          disabled: !isOpen && !isChildActive,
          layout: "position",
          variants: {
            opened: {
              ...childVariants.opened,
              opacity: 1,
            },
            closed: {
              ...childVariants.closed,
              scale: isChildActive ? 1 : childVariants.closed?.scale,
              opacity: isChildActive ? 1 : 0,
            },
          },
          transition: {
            ...transition,
            ...child.props.transition,
          },
          style: {
            zIndex: isChildActive || wasChildActive ? 10 : 1,
            gridColumn: isOpen ? undefined : 1,
            gridRow: 1,
            ...child.props.style,
          },
          onClick: onSelect,
          "data-is-active": isChildActive,
          "data-was-active": wasChildActive,
        } as ComponentProps<typeof motion.button>);
      })}
    </motion.div>
  );
}
