import { ChangeEvent, KeyboardEvent, useContext } from "react";

import { FilterContext } from "ui/components/Library/Team/View/FilterContext";
import { ViewContext } from "ui/components/Library/Team/View/ViewContextRoot";
import { TextInput } from "ui/components/shared/Forms";
import LaunchButton from "ui/components/shared/LaunchButton";

import styles from "../../Library.module.css";

export function FilterBarContainer() {
  const { view } = useContext(ViewContext);
  const { displayedString, setDisplayedText, setAppliedText } = useContext(FilterContext);

  if (view !== "recordings") {
    return null;
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDisplayedText(e.target.value);
  };

  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setAppliedText(e.currentTarget.value);
    }
  };

  return (
    <div className={`flex h-16 flex-row items-center space-x-3 p-4 ${styles.libraryHeader}`}>
      <TextInput
        value={displayedString}
        onChange={onChange}
        placeholder="Search"
        onKeyDown={onKeyPress}
      />
      <LaunchButton />
    </div>
  );
}
