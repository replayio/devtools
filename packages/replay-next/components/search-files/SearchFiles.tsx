import {
  ChangeEvent,
  KeyboardEvent,
  Suspense,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { STATUS_REJECTED, useStreamingValue } from "suspense";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { useNag } from "replay-next/src/hooks/useNag";
import useTooltip from "replay-next/src/hooks/useTooltip";
import { searchCache } from "replay-next/src/suspense/SearchCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";

import Icon, { IconType } from "../Icon";
import InlineResultsCount from "./InlineResultsCount";
import ResultsList from "./ResultsList";
import styles from "./SearchFiles.module.css";

export const SHOW_GLOBAL_SEARCH_EVENT_TYPE = "show-global-search";

function FilterButton({
  icon,
  toggle,
  active,
  tooltip: tooltipTitle,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconType;
  toggle: () => any;
  active: boolean;
  tooltip: string;
}) {
  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    position: "below",
    tooltip: tooltipTitle,
  });

  return (
    <>
      <button
        {...props}
        data-active={active}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={() => toggle()}
        className={active ? styles.SelectedSearchFilterButton : styles.SearchFilterButton}
      >
        <Icon className={styles.SearchFilterIcon} type={icon} />
      </button>
      {tooltip}
    </>
  );
}

export default function SearchFiles({ limit }: { limit?: number }) {
  const client = useContext(ReplayClientContext);
  const { openSourceIds } = useContext(SourcesContext);

  const [excludeNodeModules, setExcludeNodeModules] = useState(true);
  const [queryForDisplay, setQueryForDisplay] = useState("");
  const [includedFiles, setIncludedFiles] = useState("");
  const [excludedFiles, setExcludedFiles] = useState("");
  const [openEditors, setOpenEditors] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [queryForSuspense, setQueryForSuspense] = useState("");
  const [, dismissSearchSourceTextNag] = useNag(Nag.SEARCH_SOURCE_TEXT);

  const inputRef = useRef<HTMLInputElement>(null);

  const streaming = searchCache.stream(
    client,
    queryForSuspense,
    excludeNodeModules,
    includedFiles,
    excludedFiles,
    openEditors ? openSourceIds : null,
    useRegex,
    caseSensitive,
    wholeWord,
    limit
  );

  const { status } = useStreamingValue(streaming);

  const didError = status === STATUS_REJECTED;

  const onChange =
    (dispatcher: React.Dispatch<React.SetStateAction<string>>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatcher(event.target.value);
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
  }, [dismissSearchSourceTextNag]);

  return (
    <div className={styles.SearchFiles} data-test-id="FileSearch-Pane">
      <div className={styles.Content}>
        <div
          className={styles.InputWrapper}
          data-error={didError || undefined}
          data-test-id="SearchFiles-SearchInput"
        >
          <Icon className={styles.Icon} type="search" />
          <input
            autoFocus
            className={styles.Input}
            data-test-id="FileSearch-Input"
            onChange={onChange(setQueryForDisplay)}
            onKeyDown={onKeyDown}
            placeholder="Find in files..."
            ref={inputRef}
            type="text"
            value={queryForDisplay}
          />
          <Suspense>
            <InlineResultsCount streaming={streaming} />
          </Suspense>
          <FilterButton
            active={caseSensitive}
            toggle={() => setCaseSensitive(!caseSensitive)}
            icon="case-sensitive"
            tooltip="Match Case"
          />
          <FilterButton
            active={wholeWord}
            toggle={() => setWholeWord(!wholeWord)}
            icon="whole-word"
            tooltip="Match Whole word"
          />
          <FilterButton
            active={useRegex}
            toggle={() => setUseRegex(!useRegex)}
            icon="regex"
            tooltip="Use Regular Expression"
          />
        </div>
        <div
          className={styles.InputWrapper}
          data-error={didError || undefined}
          data-test-id="IncludeFiles-SearchInput"
        >
          <Icon className={styles.Icon} type="folder-open" />
          <input
            className={styles.Input}
            data-test-id="FileInclude-Input"
            onChange={onChange(setIncludedFiles)}
            placeholder="Files to include..."
            type="text"
            value={includedFiles}
          />
          <FilterButton
            active={openEditors}
            toggle={() => setOpenEditors(!openEditors)}
            icon="open-editors"
            tooltip="Search only in Open Editors"
          />
        </div>
        <div
          className={styles.InputWrapper}
          data-error={didError || undefined}
          data-test-id="ExcludeFiles-SearchInput"
        >
          <Icon className={styles.Icon} type="folder-closed" />
          <input
            className={styles.Input}
            data-test-id="FileExclude-Input"
            onChange={onChange(setExcludedFiles)}
            placeholder="Files to exclude..."
            type="text"
            value={excludedFiles}
          />
          <FilterButton
            active={excludeNodeModules}
            toggle={() => setExcludeNodeModules(!excludeNodeModules)}
            icon="settings-off"
            data-test-id="FileSearch-ExcludeNodeModules"
            tooltip="Exclude Node Modules"
          />
        </div>
        <Suspense>
          <ResultsList query={queryForSuspense} streaming={streaming} />
        </Suspense>
      </div>
    </div>
  );
}
