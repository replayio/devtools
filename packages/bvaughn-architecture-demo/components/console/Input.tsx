import { useContext, useEffect, useRef } from "react";

import Icon from "../Icon";

import styles from "./Input.module.css";
import { SearchContext } from "./SearchContext";

export default function Input({ className }: { className: string }) {
  const [searchState, searchActions] = useContext(SearchContext);

  // TODO Make terminal work

  const ref = useRef<HTMLInputElement>(null);
  const searchStateVisibleRef = useRef(false);

  useEffect(() => {
    if (!searchState.visible && searchStateVisibleRef.current) {
      ref?.current?.focus();
    }

    searchStateVisibleRef.current = searchState.visible;
  }, [searchState.visible]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "f" && event.metaKey) {
      event.preventDefault();

      searchActions.show();
    }
  };

  return (
    <div className={`${styles.Container} ${className}`}>
      <Icon className={styles.Icon} type="prompt" />
      <input ref={ref} className={styles.Input} onKeyDown={onKeyDown} type="text" />
    </div>
  );
}
