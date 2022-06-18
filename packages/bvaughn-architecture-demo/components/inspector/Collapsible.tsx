import { ReactNode, useState } from "react";

import Icon from "../Icon";

import styles from "./Collapsible.module.css";

export default function Collapsible({
  defaultOpen = false,
  header,
  renderChildren,
}: {
  defaultOpen?: boolean;
  header: ReactNode;
  renderChildren: () => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.Collapsible}>
      <div className={styles.PreviewRow} onClick={() => setIsOpen(!isOpen)}>
        <div className={isOpen ? styles.ArrowExpanded : styles.ArrowCollapsed}>
          <Icon className={styles.ArrowIcon} type="arrow" />
        </div>
        {header}
      </div>

      {isOpen ? (
        <div className={styles.Children}>
          <LazyChildren renderProp={renderChildren} />
        </div>
      ) : null}
    </div>
  );
}

function LazyChildren({ renderProp }: { renderProp: () => ReactNode }) {
  return <>{renderProp()}</>;
}
