import LaunchButton from "ui/components/shared/LaunchButton";
import styles from "../../Library.module.css";
import { FilterBar } from "./FilterBar";

export function FilterBarContainer() {
  return (
    <div className={`flex h-16 flex-row items-center space-x-3 p-4 ${styles.libraryHeader}`}>
      <FilterBar />
      <LaunchButton />
    </div>
  );
}
