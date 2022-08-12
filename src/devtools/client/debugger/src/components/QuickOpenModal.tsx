/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Dictionary } from "@reduxjs/toolkit";
import fuzzyAldrin from "fuzzaldrin-plus";

import type { UIState } from "ui/state";

import { basename } from "../utils/path";
import debounce from "lodash/debounce";
import actions from "../actions";
import {
  getQuickOpenEnabled,
  getQuickOpenQuery,
  getQuickOpenType,
  getQuickOpenProject,
  getSymbols,
  getTabs,
  isSymbolsLoading,
  getContext,
  getShowOnlyOpenSources,
  getSourcesForTabs,
} from "../selectors";
import {
  getAllSourceDetails,
  getSelectedSource,
  getSourcesLoading,
  getSourceContentsLoaded,
  getSourcesToDisplayByUrl,
  SourceDetails,
} from "ui/reducers/sources";
import { setViewMode } from "ui/actions/layout";
import { getViewMode } from "ui/reducers/layout";
import { memoizeLast } from "../utils/memoizeLast";
import { scrollList } from "../utils/result-list";
import {
  formatSymbols,
  parseLineColumn,
  formatShortcutResults,
  formatSources,
  SearchResult,
} from "../utils/quick-open";
import Modal from "./shared/Modal";
import SearchInput from "./shared/SearchInput";
import ResultList from "./shared/ResultList";
import { trackEvent } from "ui/utils/telemetry";
import { getGlobalFunctions, isGlobalFunctionsLoading } from "../reducers/ast";

const maxResults = 100;

const SIZE_BIG = { size: "big" };
const SIZE_DEFAULT = {};

type $FixTypeLater = any;

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
type PropsFromRedux = ConnectedProps<typeof connector>;

interface QOMState {
  results: SearchResult[] | null;
  selectedIndex: number;
}

export class QuickOpenModal extends Component<PropsFromRedux, QOMState> {
  constructor(props: PropsFromRedux) {
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

  componentDidUpdate(prevProps: PropsFromRedux) {
    const hasChanged = (field: keyof PropsFromRedux) => prevProps[field] !== this.props[field];

    // TODO Replace use of string refs
    // @ts-expect-error ignore refs
    if (this.refs.resultList && this.refs.resultList.refs) {
      // @ts-expect-error ignore refs
      scrollList(this.refs.resultList.refs, this.state.selectedIndex);
    }

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

  formatSources = memoizeLast(
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
        return;
      }

      if (query == "" && !this.isShortcutQuery()) {
        return this.showTopSources();
      }

      if (this.isFunctionQuery()) {
        return this.searchFunctions(query);
      }

      if (this.isShortcutQuery()) {
        return this.searchShortcuts(query);
      }

      return this.searchSources(query);
    }, this.getDebounceMs());

  updateResults = this.getUpdateResultsCallback();

  setModifier = (item: SearchResult) => {
    if (["@", "#", ":"].includes(item.id)) {
      this.props.setQuickOpenQuery(item.id);
    }
  };

  selectResultItem = (e: any, item: SearchResult) => {
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
      const start = item.location?.start;
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
          ? { end: item.location.end!.line, start: item.location.start.line }
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
    const { cx, selectSpecificLocation, selectedSource, viewMode, setViewMode } = this.props;

    if (location != null) {
      const selectedSourceId = selectedSource ? selectedSource.id : "";
      const sourceId = location.sourceId ? location.sourceId : selectedSourceId;
      selectSpecificLocation(cx, {
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
    const { selectedSource, selectedContentLoaded, setQuickOpenQuery } = this.props;
    setQuickOpenQuery(e.target.value);
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

  highlightMatching = (query: string, results: SearchResult[]) => {
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
      return !/^:\d*$/.test(query);
    }
    return !!query && !this.getResultCount();
  }

  getSummaryMessage() {
    const { symbolsLoading, project, globalFunctionsLoading } = this.props;

    if (this.isGotoQuery()) {
      return "Go to line";
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
    const expanded = !!items && items.length > 0;
    const showLoadingResults = query?.replace(/@/g, "") && results === null;

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
          count={this.getResultCount()}
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
            items={items}
            selected={selectedIndex}
            selectItem={this.selectResultItem}
            ref="resultList"
            expanded={expanded}
            {...(this.isSourceSearch() ? SIZE_BIG : SIZE_DEFAULT)}
          />
        )}
      </Modal>
    );
  }
}

function mapStateToProps(state: UIState) {
  const selectedSource = getSelectedSource(state)!;
  const tabs = getTabs(state);
  const sourceList = getAllSourceDetails(state);
  const symbols = getSymbols(state, selectedSource);

  return {
    cx: getContext(state),
    sourcesToDisplayByUrl: getSourcesToDisplayByUrl(state),
    enabled: getQuickOpenEnabled(state),
    globalFunctions: getGlobalFunctions(state) || [],
    globalFunctionsLoading: isGlobalFunctionsLoading(state),
    project: getQuickOpenProject(state),
    query: getQuickOpenQuery(state),
    searchType: getQuickOpenType(state),
    selectedContentLoaded: selectedSource
      ? getSourceContentsLoaded(state, selectedSource.id)
      : undefined,
    selectedSource,
    showOnlyOpenSources: getShowOnlyOpenSources(state),
    sourcesForTabs: getSourcesForTabs(state),
    sourceCount: sourceList.length,
    sourcesLoading: getSourcesLoading(state),
    symbols: formatSymbols(symbols),
    symbolsLoading: isSymbolsLoading(state, selectedSource),
    tabs,
    viewMode: getViewMode(state),
  };
}

const connector = connect(mapStateToProps, {
  closeQuickOpen: actions.closeQuickOpen,
  highlightLineRange: actions.highlightLineRange,
  selectSpecificLocation: actions.selectSpecificLocation,
  setQuickOpenQuery: actions.setQuickOpenQuery,
  setViewMode,
});

export default connector(QuickOpenModal);
