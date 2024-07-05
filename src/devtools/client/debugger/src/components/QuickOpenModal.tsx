import { Dictionary } from "@reduxjs/toolkit";
import fuzzyAldrin from "fuzzaldrin-plus";
import debounce from "lodash/debounce";
import memoizeOne from "memoize-one";
import React, { Component } from "react";
import { useImperativeCacheValue } from "suspense";

import { ReportProblemLink } from "replay-next/components/errors/ReportProblemLink";
import { sourceOutlineCache } from "replay-next/src/suspense/SourceOutlineCache";
import {
  streamingSourceContentsCache,
  useSourcesById,
} from "replay-next/src/suspense/SourcesCache";
import { replayClient } from "shared/client/ReplayClientContext";
import { ViewMode } from "shared/user-data/GraphQL/config";
import { setViewMode as setViewModeAction } from "ui/actions/layout";
import { getViewMode } from "ui/reducers/layout";
import { SourceDetails, getSelectedSourceId, getSourcesToDisplayByUrl } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import actions from "../actions";
import { PartialLocation } from "../actions/sources/select";
import { getGlobalFunctions, isGlobalFunctionsLoading } from "../reducers/ast";
import {
  Context,
  HighlightedRange,
  SearchTypes,
  Tab,
  getContext,
  getQuickOpenEnabled,
  getQuickOpenProject,
  getQuickOpenQuery,
  getQuickOpenType,
  getShowOnlyOpenSources,
  getSourcesForTabs,
  getTabs,
} from "../selectors";
import { basename } from "../utils/path";
import {
  SearchResult,
  formatShortcutResults,
  formatSources,
  formatSymbols,
  parseLineColumn,
} from "../utils/quick-open";
import Modal from "./shared/Modal";
import ResultList from "./shared/ResultList";
import SearchInput from "./shared/SearchInput";

const maxResults = 100;

const SIZE_BIG = { size: "big" };
const SIZE_DEFAULT = {};

export type SearchResultWithHighlighting = Omit<SearchResult, "title"> & {
  title: string | JSX.Element;
};

function filter(values: SearchResult[], query: string) {
  const preparedQuery = fuzzyAldrin.prepareQuery(query);

  return query
    ? fuzzyAldrin.filter(values, query, {
        key: "value",
        maxResults,
        preparedQuery,
      })
    : values;
}

interface QOMState {
  results: SearchResult[] | null;
  selectedIndex: number;
}

class QuickOpenModal extends Component<QuickOpenModalProps, QOMState> {
  resultList = React.createRef<ResultList>();
  constructor(props: QuickOpenModalProps) {
    super(props);

    this.state = {
      results: props.showOnlyOpenSources
        ? this.formatSources(props.sourcesToDisplayByUrl, props.tabs, false)
        : null,
      selectedIndex: 0,
    };
  }

  setResults(results: SearchResult[]) {
    if (results) {
      results = results.slice(0, maxResults);
    }
    this.setState({ results });
  }

  componentDidUpdate(prevProps: QuickOpenModalProps) {
    const hasChanged = (field: keyof QuickOpenModalProps) => prevProps[field] !== this.props[field];

    this.resultList.current?.scrollList(this.state.selectedIndex);

    if (hasChanged("sourceCount")) {
      // If the source count has changed, we need to update the throttled
      // updateResults callback with the appropriate throttle duration.
      this.updateResults = this.getUpdateResultsCallback();
    }

    if (
      hasChanged("enabled") ||
      hasChanged("query") ||
      hasChanged("symbols") ||
      hasChanged("globalFunctions")
    ) {
      this.updateResults(this.props.query);
    }
  }

  closeModal = () => {
    this.props.closeQuickOpen();
  };

  dropGoto = (query: string) => {
    const index = query.indexOf(":");
    return index !== -1 ? query.slice(0, index) : query;
  };

  formatSources = memoizeOne(
    (
      sourcesToDisplayByUrl: Dictionary<SourceDetails>,
      tabs: { url: string }[],
      onlySourcesInTabs: boolean
    ) => {
      const tabUrls = new Set(tabs.map(tab => tab.url));
      return formatSources(sourcesToDisplayByUrl, tabUrls, onlySourcesInTabs);
    }
  );

  searchSources = (query: string) => {
    const { tabs, showOnlyOpenSources, sourcesLoading, sourcesToDisplayByUrl } = this.props;

    if (sourcesLoading) {
      return null;
    }

    const sources = this.formatSources(sourcesToDisplayByUrl, tabs, showOnlyOpenSources);
    const results = query == "" ? sources : filter(sources, this.dropGoto(query));
    return this.setResults(results);
  };

  getFunctions() {
    const { project, symbols, globalFunctions } = this.props;

    return project ? globalFunctions || [] : symbols.functions;
  }

  searchFunctions(query: string) {
    let fns = this.getFunctions() as SearchResult[];

    if (query === "@" || query === "#") {
      return this.setResults(fns);
    }

    const filteredFns = filter(fns, query.slice(1));
    return this.setResults(filteredFns);
  }

  searchShortcuts = (query: string) => {
    const results = formatShortcutResults();
    if (query == "?") {
      this.setResults(results);
    } else {
      this.setResults(filter(results, query.slice(1)));
    }
  };

  showTopSources = () => {
    const { tabs, sourcesToDisplayByUrl } = this.props;
    const tabUrls = new Set(tabs.map(tab => tab.url));
    this.setResults(formatSources(sourcesToDisplayByUrl, tabUrls, tabs.length > 0));
  };

  getDebounceMs = () => {
    const { sourceCount } = this.props;

    if (sourceCount > 10_000) {
      return 1000;
    }

    if (sourceCount > 1_000) {
      return 100;
    }

    return 50;
  };

  getUpdateResultsCallback = () =>
    debounce(query => {
      if (this.isGotoQuery()) {
        this.setResults([]);
      } else if (query == "" && !this.isShortcutQuery()) {
        this.showTopSources();
      } else if (this.isFunctionQuery()) {
        this.searchFunctions(query);
      } else if (this.isShortcutQuery()) {
        this.searchShortcuts(query);
      } else {
        this.searchSources(query);
      }
    }, this.getDebounceMs());

  updateResults = this.getUpdateResultsCallback();

  setModifier = (item: SearchResultWithHighlighting) => {
    if (["@", "#", ":"].includes(item.id)) {
      this.props.setQuickOpenQuery(item.id);
    }
  };

  selectResultItem = (e: any, item: SearchResultWithHighlighting) => {
    if (item == null) {
      return;
    }

    if (this.isShortcutQuery()) {
      return this.setModifier(item);
    }

    if (this.isGotoSourceQuery()) {
      trackEvent("quick_open.select_line");

      const location = parseLineColumn(this.props.query);
      return this.gotoLocation({ ...location, sourceId: item.id });
    }

    if (this.isFunctionQuery()) {
      const start = item.location?.begin;
      trackEvent("quick_open.select_function");

      return this.gotoLocation({
        line: start?.line || 0,
        sourceId: start?.sourceId,
      });
    }

    trackEvent("quick_open.select_source");
    this.gotoLocation({ sourceId: item.id, line: 0 });
  };

  onSelectResultItem = (item: SearchResult) => {
    const { selectedSource, highlightLineRange, project } = this.props;

    if (selectedSource == null || !this.isFunctionQuery()) {
      return;
    }

    if (this.isFunctionQuery() && !project) {
      return highlightLineRange({
        ...(item.location != null
          ? { end: item.location.end!.line, start: item.location.begin.line }
          : {}),
        sourceId: selectedSource.id,
      });
    }
  };

  traverseResults = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const direction = e.key === "ArrowUp" ? -1 : 1;
    const { selectedIndex, results } = this.state;
    const resultCount = this.getResultCount();
    const index = selectedIndex + direction;
    const nextIndex = (index + resultCount) % resultCount || 0;

    this.setState({ selectedIndex: nextIndex });

    if (results != null) {
      this.onSelectResultItem(results[nextIndex]);
    }
  };

  gotoLocation = (location?: { column?: number; line?: number; sourceId?: string }) => {
    const { cx, selectLocation, selectedSource, viewMode, setViewMode } = this.props;

    if (location != null) {
      const selectedSourceId = selectedSource ? selectedSource.id : "";
      const sourceId = location.sourceId ? location.sourceId : selectedSourceId;
      selectLocation(cx, {
        column: location.column,
        line: location.line,
        sourceId,
      });

      if (viewMode === "non-dev") {
        setViewMode("dev");
      }
      this.closeModal();
    }
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { selectedSource, setQuickOpenQuery } = this.props;
    setQuickOpenQuery(e.target.value);

    let selectedContentLoaded = false;
    if (selectedSource) {
      const streaming = streamingSourceContentsCache.stream(replayClient, selectedSource.id);
      selectedContentLoaded = streaming?.complete === true;
    }
    const noSource = !selectedSource || !selectedContentLoaded;

    if ((noSource && this.isFunctionQuery()) || this.isGotoQuery()) {
      return;
    }

    this.updateResults(e.target.value);
  };

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { enabled, query } = this.props;
    const { selectedIndex } = this.state;
    const isGoToQuery = this.isGotoQuery();
    const results = this.state.results;

    if ((!enabled || !results) && !isGoToQuery) {
      return;
    }

    if (e.key === "Enter") {
      if (isGoToQuery) {
        const location = parseLineColumn(query);
        return this.gotoLocation(location);
      }

      if (results) {
        return this.selectResultItem(e, results[selectedIndex]);
      }
    }

    if (e.key === "Tab") {
      return this.closeModal();
    }

    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      return this.traverseResults(e);
    }
  };

  getResultCount = () => {
    const results = this.state.results;

    return results && results.length ? results.length : 0;
  };

  // Query helpers
  isFunctionQuery = () => this.props.searchType === "functions";
  isGotoQuery = () => this.props.searchType === "goto";
  isGotoSourceQuery = () => this.props.searchType === "gotoSource";
  isShortcutQuery = () => this.props.searchType === "shortcuts";
  isSourcesQuery = () => this.props.searchType === "sources";
  isSourceSearch = () => this.isSourcesQuery() || this.isGotoSourceQuery();

  renderHighlight(candidateString: string, query: string) {
    const options = {
      wrap: {
        tagClose: "</mark>",
        tagOpen: '<mark class="highlight">',
      },
    };

    // There might be a match in the path but not the title.
    // In this case just render the whole title, un-styled.
    //
    // Note that "fuzzaldrin-plus" returns an HTML string usually,
    // but if either the input string or the query string are empty, it returns an array.
    const html = query ? fuzzyAldrin.wrap(candidateString, query, options) : candidateString;

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  highlightMatching = (query: string, results: SearchResult[]): SearchResultWithHighlighting[] => {
    let newQuery = query;
    if (newQuery === "") {
      return results;
    }
    newQuery = query.replace(/[@:#?]/gi, " ");

    return results.map(result => {
      if (typeof result.title == "string") {
        return {
          ...result,
          title: this.renderHighlight(result.title, basename(newQuery)),
        };
      }
      return result;
    });
  };

  shouldShowErrorEmoji() {
    const { query } = this.props;
    if (this.isGotoQuery()) {
      return !/^:\d*:*\d*$/.test(query);
    }
    return !!query && !this.getResultCount();
  }

  getSummaryMessage() {
    const { symbolsLoading, project, globalFunctionsLoading, query } = this.props;

    if (this.isGotoQuery()) {
      const isValid = /^:\d*:*\d*$/.test(query);

      const [_, line, column] = query.split(":");
      if (!isValid || line == null || line == "") {
        return "Type a line number to navigate to";
      } else if (column != null && column !== "") {
        return `Go to line ${line} and column ${column}`;
      } else {
        return `Go to line ${line}`;
      }
    }

    if (project && globalFunctionsLoading) {
      return `Loading functions`;
    }

    if (this.isFunctionQuery() && symbolsLoading) {
      return "Loading\u2026";
    }

    return "";
  }

  render() {
    const { enabled, query, sourcesLoading } = this.props;
    const { selectedIndex, results } = this.state;

    if (!enabled) {
      return null;
    }

    const items = this.highlightMatching(query, results || []);
    const resultsCount = this.getResultCount();
    const expanded = !!items && items.length > 0;
    const showLoadingResults = query?.replace(/@/g, "") && results === null;
    const showReportProblemLink =
      !sourcesLoading && !showLoadingResults && query && resultsCount < 5;

    return (
      <Modal
        width="500px"
        additionalClass={"rounded-lg text-xs"}
        in={enabled}
        handleClose={this.closeModal}
      >
        <SearchInput
          query={query}
          hasPrefix={true}
          count={resultsCount}
          dataTestId="QuickOpenInput"
          placeholder={"Go to file…"}
          summaryMsg={this.getSummaryMessage()}
          showErrorEmoji={this.shouldShowErrorEmoji()}
          isLoading={false}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          handleClose={this.closeModal}
          expanded={expanded}
          showClose={false}
          selectedItemId={expanded && items[selectedIndex] ? items[selectedIndex].id : ""}
          size="big"
        />
        {sourcesLoading && <div className="px-2 py-1">Sources Loading…</div>}
        {!sourcesLoading && showLoadingResults && <div className="px-2 py-1">Loading results…</div>}
        {results && items && (
          <ResultList
            key="results"
            dataTestId="QuickOpenResultsList"
            items={items}
            selected={selectedIndex}
            selectItem={this.selectResultItem}
            ref={this.resultList}
            expanded={expanded}
            {...(this.isSourceSearch() ? SIZE_BIG : SIZE_DEFAULT)}
          />
        )}
        {showReportProblemLink && (
          <div className="report-a-problem">
            <span className="report-a-problem-icon" />
            <span className="report-a-problem-text">Something missing from this list?</span>
            <ReportProblemLink
              context={{
                id: "file-search",
                query,
                results,
              }}
              onClick={this.props.closeQuickOpen}
              title="Report a problem with file search"
            />
          </div>
        )}
      </Modal>
    );
  }
}

interface QuickOpenModalProps {
  cx: Context;
  enabled: boolean;
  globalFunctions: SearchResult[];
  globalFunctionsLoading: boolean;
  project: boolean;
  query: string;
  searchType: SearchTypes;
  selectedSource: SourceDetails | null | undefined;
  showOnlyOpenSources: boolean;
  sourceCount: number;
  sourcesForTabs: SourceDetails[];
  sourcesLoading: boolean;
  sourcesToDisplayByUrl: ReturnType<typeof getSourcesToDisplayByUrl>;
  symbols: ReturnType<typeof formatSymbols>;
  symbolsLoading: boolean;
  tabs: Tab[];
  viewMode: ViewMode;
  closeQuickOpen: () => unknown;
  highlightLineRange: (range: HighlightedRange) => unknown;
  selectLocation: (cx: Context, location: PartialLocation, openSource?: boolean) => unknown;
  setQuickOpenQuery: (query: string) => unknown;
  setViewMode: (viewMode: ViewMode) => unknown;
}

export default function QuickOpenModalWrapper() {
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const sourcesById = useSourcesById(replayClient);
  const selectedSource = selectedSourceId ? sourcesById.get(selectedSourceId) : undefined;
  const symbolsCacheValue = useImperativeCacheValue(
    sourceOutlineCache,
    replayClient,
    selectedSource?.id
  );
  const dispatch = useAppDispatch();
  const props: QuickOpenModalProps = {
    cx: useAppSelector(getContext),
    enabled: useAppSelector(getQuickOpenEnabled),
    globalFunctions: useAppSelector(getGlobalFunctions) || [],
    globalFunctionsLoading: useAppSelector(isGlobalFunctionsLoading),
    project: useAppSelector(getQuickOpenProject),
    query: useAppSelector(getQuickOpenQuery),
    searchType: useAppSelector(getQuickOpenType),
    selectedSource,
    showOnlyOpenSources: useAppSelector(getShowOnlyOpenSources),
    sourceCount: sourcesById.size,
    sourcesForTabs: useAppSelector(getSourcesForTabs),
    sourcesLoading: sourcesById.size === 0,
    sourcesToDisplayByUrl: useAppSelector(getSourcesToDisplayByUrl),
    symbols:
      symbolsCacheValue.status === "resolved"
        ? formatSymbols(symbolsCacheValue.value)
        : { functions: [] },
    symbolsLoading: symbolsCacheValue.status !== "resolved",
    tabs: useAppSelector(getTabs),
    viewMode: useAppSelector(getViewMode),
    closeQuickOpen: () => dispatch(actions.closeQuickOpen()),
    highlightLineRange: (range: HighlightedRange) => dispatch(actions.highlightLineRange(range)),
    selectLocation: (cx: Context, location: PartialLocation, openSource?: boolean) =>
      dispatch(actions.selectLocation(cx, location, openSource)),
    setQuickOpenQuery: (query: string) => dispatch(actions.setQuickOpenQuery(query)),
    setViewMode: (viewMode: ViewMode) => dispatch(setViewModeAction(viewMode)),
  };

  return <QuickOpenModal {...props} />;
}
