import classNames from "classnames";
import React, { useState } from "react";
import styles from "./Accordion.module.css";

export interface AccordionItem {
  className?: string;
  component: React.ReactNode;
  header: string;
  onToggle?: (open: boolean) => void;
  collapsed?: boolean;
}

const Accordion = ({ items }: { items: AccordionItem[] }) => {
  const [state, setState] = useState(items);

  return (
    <div
      className={classNames(
        styles.accordion,
        styles[`items-${items.filter(i => !i.collapsed).length}`]
      )}
    >
      {state.map(({ className, onToggle, header, component, collapsed }, i) => {
        return (
          <div
            key={i}
            className={classNames(className, styles.accordionItemContainer, {
              [styles.open]: !collapsed,
            })}
          >
            <div
              className={styles.header}
              onClick={() => {
                let newState = [...state];
                let newValue = !newState[i].collapsed;
                newState[i].collapsed = newValue;
                onToggle?.(newValue);
                setState(newState);
              }}
            >
              <h2>
                <span
                  className={classNames("img arrow", { expanded: !collapsed })}
                  style={{ marginInlineEnd: "4px" }}
                />

                {header}
              </h2>
            </div>
            <div className={classNames(styles.content, { [styles.open]: !collapsed })}>
              {component}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
