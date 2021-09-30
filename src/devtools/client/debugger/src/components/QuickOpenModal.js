/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import { connect } from "../utils/connect";
import fuzzyAldrin from "fuzzaldrin-plus";
import { basename } from "../utils/path";
import throttle from "lodash/throttle";
import { createSelector } from "reselect";
import { ThreadFront } from "protocol/thread";
import actions from "../actions";
import {
  getSourceList,
  getQuickOpenEnabled,
  getQuickOpenQuery,
  getQuickOpenType,
  getQuickOpenProject,
  getSelectedSource,
  getSourceContent,
  getProjectSymbols,
  getSymbols,
  getTabs,
  getDisplayedSources,
  isSymbolsLoading,
  getProjectSymbolsLoading,
  getContext,
} from "../selectors";
import { memoizeLast } from "../utils/memoizeLast";
import { scrollList } from "../utils/result-list";
import {
  formatSymbols,
  parseLineColumn,
  formatShortcutResults,
  formatSources,
  formatProjectSymbols,
} from "../utils/quick-open";
import Modal from "./shared/Modal";
import SearchInput from "./shared/SearchInput";
import ResultList from "./shared/ResultList";

import "./QuickOpenModal.css";

const updateResultsThrottle = 100;
const maxResults = 100;

const SIZE_BIG = { size: "big" };
const SIZE_DEFAULT = {};

function filter(values, query) {
  const preparedQuery = fuzzyAldrin.prepareQuery(query);

  return fuzzyAldrin.filter(values, query, {
    key: "value",
    maxResults,
    preparedQuery,
  });
}

export class QuickOpenModal extends Component {
  constructor(props) {
    super(props);
    this.state = { results: null, selectedIndex: 0 };
  }

  setResults(results) {
    if (results) {
      results = results.slice(0, maxResults);
    }
    this.setState({ results });
  }

  componentDidMount() {
    const { query, shortcutsModalEnabled, toggleShortcutsModal } = this.props;

    this.updateResults(query);

    if (shortcutsModalEnabled) {
      toggleShortcutsModal();
    }
  }

  componentDidUpdate(prevProps) {
    const hasChanged = field => prevProps[field] !== this.props[field];

    if (this.refs.resultList && this.refs.resultList.refs) {
      scrollList(this.refs.resultList.refs, this.state.selectedIndex);
    }

    if (
      hasChanged("enabled") ||
      hasChanged("query") ||
      hasChanged("symbols") ||
      hasChanged("projectSymbols")
    ) {
      this.updateResults(this.props.query);
    }
  }

  closeModal = () => {
    this.props.closeQuickOpen();
  };

  dropGoto = query => {
    const index = query.indexOf(":");
    return index !== -1 ? query.slice(0, index) : query;
  };

  selectPreferredSources = memoizeLast(sourceList =>
    sourceList.filter(source => ThreadFront.isPreferredSource(source.id))
  );

  formatSources = memoizeLast((sourceList, tabs) => {
    const tabUrls = new Set(tabs.map(tab => tab.url));
    return formatSources(sourceList, tabUrls);
  });

  searchSources = query => {
    const { sourceList, tabs } = this.props;

    const sources = this.formatSources(this.selectPreferredSources(sourceList), tabs);
    const results = query == "" ? sources : filter(sources, this.dropGoto(query));
    return this.setResults(results);
  };

  getFunctions() {
    const { project, projectSymbols, symbols } = this.props;
    return project ? projectSymbols.functions : symbols.functions;
  }

  searchSymbols = query => {
    let results = this.getFunctions();
    results = results.filter(result => result.title !== "anonymous");

    if (query.length <= 3) {
      results = results.slice(0, 10000);
    }

    if (query === "@" || query === "#") {
      return this.setResults(results);
    }
    results = filter(results, query.slice(1));
    return this.setResults(results);
  };

  searchShortcuts = query => {
    const results = formatShortcutResults();
    if (query == "?") {
      this.setResults(results);
    } else {
      this.setResults(filter(results, query.slice(1)));
    }
  };

  showTopSources = () => {
    const { sourceList, tabs } = this.props;
    const tabUrls = new Set(tabs.map(tab => tab.url));

    if (tabs.length > 0) {
      this.setResults(
        formatSources(
          sourceList.filter(source => !!source.url && tabUrls.has(source.url)),
          tabUrls
        )
      );
    } else {
      this.setResults(formatSources(sourceList, tabUrls));
    }
  };

  updateResults = throttle(query => {
    if (this.isGotoQuery()) {
      return;
    }

    if (query == "" && !this.isShortcutQuery()) {
      return this.showTopSources();
    }

    if (this.isSymbolSearch()) {
      return this.searchSymbols(query);
    }

    if (this.isShortcutQuery()) {
      return this.searchShortcuts(query);
    }

    return this.searchSources(query);
  }, updateResultsThrottle);

  setModifier = item => {
    if (["@", "#", ":"].includes(item.id)) {
      this.props.setQuickOpenQuery(item.id);
    }
  };

  selectResultItem = (e, item) => {
    if (item == null) {
      return;
    }

    if (this.isShortcutQuery()) {
      return this.setModifier(item);
    }

    if (this.isGotoSourceQuery()) {
      const location = parseLineColumn(this.props.query);
      return this.gotoLocation({ ...location, sourceId: item.id });
    }

    if (this.isSymbolSearch()) {
      const start = item.location?.start;
      return this.gotoLocation({
        line: start?.line || 0,
        sourceId: start?.sourceId,
      });
    }

    this.gotoLocation({ sourceId: item.id, line: 0 });
  };

  onSelectResultItem = item => {
    const { selectedSource, highlightLineRange, project } = this.props;
    if (selectedSource == null || !this.isSymbolSearch()) {
      return;
    }

    if (this.isFunctionQuery() && !project) {
      return highlightLineRange({
        ...(item.location != null
          ? { start: item.location.start.line, end: item.location.end.line }
          : {}),
        sourceId: selectedSource.id,
      });
    }
  };

  traverseResults = e => {
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

  gotoLocation = location => {
    const { cx, selectSpecificLocation, selectedSource } = this.props;

    if (location != null) {
      const selectedSourceId = selectedSource ? selectedSource.id : "";
      const sourceId = location.sourceId ? location.sourceId : selectedSourceId;
      selectSpecificLocation(cx, {
        sourceId,
        line: location.line,
        column: location.column,
      });
      this.closeModal();
    }
  };

  onChange = e => {
    const { selectedSource, selectedContentLoaded, setQuickOpenQuery } = this.props;
    setQuickOpenQuery(e.target.value);
    const noSource = !selectedSource || !selectedContentLoaded;
    if ((noSource && this.isSymbolSearch()) || this.isGotoQuery()) {
      return;
    }

    this.updateResults(e.target.value);
  };

  onKeyDown = e => {
    const { enabled, query } = this.props;
    const { results, selectedIndex } = this.state;
    const isGoToQuery = this.isGotoQuery();

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
  isSymbolSearch = () => this.isFunctionQuery();
  isGotoQuery = () => this.props.searchType === "goto";
  isGotoSourceQuery = () => this.props.searchType === "gotoSource";
  isShortcutQuery = () => this.props.searchType === "shortcuts";
  isSourcesQuery = () => this.props.searchType === "sources";
  isSourceSearch = () => this.isSourcesQuery() || this.isGotoSourceQuery();

  /* eslint-disable react/no-danger */
  renderHighlight(candidateString, query, name) {
    const options = {
      wrap: {
        tagOpen: '<mark class="highlight">',
        tagClose: "</mark>",
      },
    };
    const html = fuzzyAldrin.wrap(candidateString, query, options);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  highlightMatching = (query, results) => {
    let newQuery = query;
    if (newQuery === "") {
      return results;
    }
    newQuery = query.replace(/[@:#?]/gi, " ");

    return results.map(result => {
      if (typeof result.title == "string") {
        return {
          ...result,
          title: this.renderHighlight(result.title, basename(newQuery), "title"),
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
    const { symbolsLoading, projectSymbolsLoading, project } = this.props;

    if (this.isGotoQuery()) {
      return "Go to line";
    }

    if (project && projectSymbolsLoading) {
      const { loaded, total } = projectSymbolsLoading;
      if (loaded == total) {
        const functions = this.getFunctions();
        return `${functions.length} functions`;
      }

      return `Loading ${loaded} of ${total} files\u2026`;
    }

    if (this.isFunctionQuery() && symbolsLoading) {
      return "Loading\u2026";
    }

    return "";
  }

  render() {
    const { enabled, query } = this.props;
    const { selectedIndex, results } = this.state;

    if (!enabled) {
      return null;
    }

    const items = this.highlightMatching(query, results || []);
    const expanded = !!items && items.length > 0;

    return (
      <Modal in={enabled} handleClose={this.closeModal}>
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
          {...(this.isSourceSearch() ? SIZE_BIG : SIZE_DEFAULT)}
        />
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

const selectProjectSymbols = createSelector(
  getDisplayedSources,
  getProjectSymbols,
  (displayedSources, symbols) => formatProjectSymbols(symbols, displayedSources)
);

/* istanbul ignore next: ignoring testing of redux connection stuff */
function mapStateToProps(state) {
  const selectedSource = getSelectedSource(state);
  const tabs = getTabs(state);

  return {
    cx: getContext(state),
    enabled: getQuickOpenEnabled(state),
    project: getQuickOpenProject(state),
    sourceList: getSourceList(state),
    displayedSources: getDisplayedSources(state),
    selectedSource,
    selectedContentLoaded: selectedSource
      ? !!getSourceContent(state, selectedSource.id)
      : undefined,
    symbols: formatSymbols(getSymbols(state, selectedSource)),
    projectSymbols: selectProjectSymbols(state),
    projectSymbolsLoading: getProjectSymbolsLoading(state),
    symbolsLoading: isSymbolsLoading(state, selectedSource),
    query: getQuickOpenQuery(state),
    searchType: getQuickOpenType(state),
    tabs,
  };
}

/* istanbul ignore next: ignoring testing of redux connection stuff */
export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
  setQuickOpenQuery: actions.setQuickOpenQuery,
  highlightLineRange: actions.highlightLineRange,
  closeQuickOpen: actions.closeQuickOpen,
})(QuickOpenModal);
