import { useContext } from "react";

import { ViewContext } from "ui/components/Library/Team/View/ViewContextRoot";
import LaunchButton from "ui/components/shared/LaunchButton";

import { FilterBar } from "./FilterBar";
import styles from "../../Library.module.css";

export function FilterBarContainer() {
  const { view } = useContext(ViewContext);

  if (view !== "recordings") {
    return null;
  }

  return (
    <div className={`flex h-16 flex-row items-center space-x-3 p-4 ${styles.libraryHeader}`}>
      <FilterBar />
      <LaunchButton />
    </div>
  );
}
