import LaunchButton from "ui/components/shared/LaunchButton";

import { FilterBar } from "./FilterBar";
import styles from "../../Library.module.css";

export function FilterBarContainer() {
  return (
    <div className={`flex h-16 flex-row items-center space-x-3 p-4 ${styles.libraryHeader}`}>
      <FilterBar />
      <LaunchButton />
    </div>
  );
}
