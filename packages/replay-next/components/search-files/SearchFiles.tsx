import {
  ChangeEvent,
  KeyboardEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Checkbox } from "design";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";

import Icon from "../Icon";
import InlineResultsCount from "./InlineResultsCount";
import ResultsList from "./ResultsList";
import styles from "./SearchFiles.module.css";

export const SHOW_GLOBAL_SEARCH_EVENT_TYPE = "show-global-search";

export default function SearchFiles({ limit }: { limit?: number }) {
  const [includeNodeModules, setIncludeNodeModules] = useState(false);
  const [queryForDisplay, setQueryForDisplay] = useState("");
  const [queryForSuspense, setQueryForSuspense] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searchSourceTextState, dismissSearchSourceTextNag] = useNag(Nag.SEARCH_SOURCE_TEXT);

  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQueryForDisplay(event.target.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter":
      case "NumpadEnter":
        startTransition(() => {
          setQueryForSuspense(queryForDisplay);
        });
        break;
      case "Escape":
        setQueryForDisplay(queryForSuspense);
        break;
    }
  };

  useEffect(() => {
    dismissSearchSourceTextNag();
    const onShowGlobalSearch = () => {
      inputRef.current?.focus();
    };

    window.addEventListener(SHOW_GLOBAL_SEARCH_EVENT_TYPE, onShowGlobalSearch);
    return () => {
      window.removeEventListener(SHOW_GLOBAL_SEARCH_EVENT_TYPE, onShowGlobalSearch);
    };
  }, []);

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
            ref={inputRef}
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

        <div className={styles.CheckboxWrapper}>
          <Checkbox
            dataTestId="SearchFiles-IncludeNodeModules"
            label="Include node modules"
            checked={includeNodeModules}
            onChange={() => setIncludeNodeModules(!includeNodeModules)}
          />
        </div>

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
