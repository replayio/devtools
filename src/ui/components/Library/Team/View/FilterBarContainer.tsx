import { useContext } from "react";
import LaunchButton from "ui/components/shared/LaunchButton";
import { ViewContext } from "./ViewPage";
import styles from "../../Library.module.css";
import { FilterBar } from "../../FilterBar";

export function FilterBarContainer() {
  const { view } = useContext(ViewContext);
  const displayedString = `this will filter ${view}`;
  return (
    <div className={`flex h-16 flex-row items-center space-x-3 p-4 ${styles.libraryHeader}`}>
      <FilterBar
        displayedString={displayedString}
        setDisplayedText={() => console.log("setDisplayedText")}
      />
      <LaunchButton />
    </div>
  );
}
