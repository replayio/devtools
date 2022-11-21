import { ChangeEvent, KeyboardEvent, Suspense, useState, useTransition } from "react";

import { Checkbox } from "design";

import Icon from "../Icon";
import InlineResultsCount from "./InlineResultsCount";
import ResultsList from "./ResultsList";
import styles from "./SearchFiles.module.css";

export default function SearchFiles({ limit }: { limit?: number }) {
  const [includeNodeModules, setIncludeNodeModules] = useState(false);
  const [queryForDisplay, setQueryForDisplay] = useState("");
  const [queryForSuspense, setQueryForSuspense] = useState("");
  const [isPending, startTransition] = useTransition();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQueryForDisplay(event.target.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter":
        startTransition(() => {
          setQueryForSuspense(queryForDisplay);
        });
        break;
      case "Escape":
        setQueryForDisplay(queryForSuspense);
        break;
    }
  };

  return (
    <div className={styles.SearchFiles}>
      <div className={styles.Content}>
        <div className={styles.InputWrapper} data-test-id="SearchFiles-SearchInput">
          <Icon className={styles.Icon} type="search" />
          <input
            autoFocus
            className={styles.Input}
            data-test-id="SearchFiles-Input"
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Find in files..."
            type="text"
            value={queryForDisplay}
          />
          <Suspense>
            <InlineResultsCount
              includeNodeModules={includeNodeModules}
              isPending={isPending}
              limit={limit}
              query={queryForSuspense}
            />
          </Suspense>
        </div>

        <Checkbox
          className={styles.Checkbox}
          dataTestId="SearchFiles-IncludeNodeModules"
          label="Include node modules"
          checked={includeNodeModules}
          onChange={() => setIncludeNodeModules(!includeNodeModules)}
        />

        <Suspense>
          <ResultsList
            includeNodeModules={includeNodeModules}
            isPending={isPending}
            limit={limit}
            query={queryForSuspense}
          />
        </Suspense>
      </div>
    </div>
  );
}
