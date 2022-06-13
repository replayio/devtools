import type { ComponentProps, ReactNode } from "react";
import { Children, cloneElement, isValidElement, useRef, useState } from "react";
import classNames from "classnames";
import { AnimateSharedLayout, motion } from "framer-motion";

import { getSpacingClassNamesFromProps } from "../utils";
import { SpacingProps } from "../types";

export function Picker<Values extends any>({
  value = null,
  onChange,
  children,
  backgroundColor,
  radius,
  ...props
}: {
  value: Values | null;
  onChange: (value: Values | null) => void;
  children: ReactNode;
  backgroundColor?: string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
} & SpacingProps) {
  const parsedProps = getSpacingClassNamesFromProps(props);
  const previousId = useRef(null);
  const [isHover, setIsHover] = useState(false);
  const isOpen = value === null;
  const isActive = isOpen || isHover;
  const transition = {
    duration: isOpen ? 0.16 : 0.2,
    opacity: { duration: isOpen ? 0.1 : 0.04 },
  };

  return (
    <motion.div
      {...parsedProps}
      data-open={isOpen}
      className={classNames("relative inline-grid items-center", parsedProps.className)}
      initial={isOpen ? "opened" : "closed"}
      animate={isOpen ? "opened" : "closed"}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
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
      <AnimateSharedLayout>
        <motion.div
          layout
          transition={transition}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            transition: "background-color 180ms ease-out",
            backgroundColor: isActive
              ? "var(--badge-background--active)"
              : "var(--badge-background)",
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

          const isChildActive = value === child.props.id;
          const wasChildActive = previousId.current === child.props.id;
          const childVariants = child.props.variants || {};

          return cloneElement(child, {
            disabled: !isOpen && !isChildActive,
            layout: true,
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
              gridColumn: isOpen ? (isChildActive ? 1 : undefined) : 1,
              gridRow: 1,
              ...child.props.style,
            },
            onClick: () => {
              const nextActiveId = isChildActive ? null : child.props.id;
              previousId.current = isChildActive ? child.props.id : null;
              onChange(nextActiveId);
            },
            "data-is-active": isChildActive,
            "data-was-active": wasChildActive,
          } as ComponentProps<typeof motion.button>);
        })}
      </AnimateSharedLayout>
    </motion.div>
  );
}
