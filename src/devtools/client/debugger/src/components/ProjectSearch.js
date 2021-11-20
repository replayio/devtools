/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "../utils/connect";
import classnames from "classnames";
import actions from "../actions";

import { getEditor } from "../utils/editor";
import { highlightMatches } from "../utils/project-search";

import { getRelativePath } from "../utils/sources-tree";
import {
  getActiveSearch,
  getTextSearchResults,
  getTextSearchStatus,
  getTextSearchQuery,
  getContext,
  getSources,
} from "../selectors";

import ManagedTree from "./shared/ManagedTree";
import AccessibleImage from "./shared/AccessibleImage";

import { PluralForm } from "devtools/shared/plural-form";
import { trackEvent } from "ui/utils/telemetry";
import { ThreadFront } from "protocol/thread";
import { groupBy } from "lodash";
import { isThirdParty } from "../utils/source";
import { sliceCodePoints } from "ui/utils/codePointString";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

const formatMatchesBySource = (matches, sourcesById) => {
  const resultsBySource = groupBy(matches, res => res.location.sourceId);
  return Object.entries(resultsBySource).map(([sourceId, matches]) => {
    return {
      type: "RESULT",
      sourceId,
      filepath: sourcesById[sourceId]?.url,
      matches: matches.map(match => {
        // We have to do this array dance to navigate the string in unicode "code points"
        // because `colunm` is calculated using "code points" as opposed to JS strings
        // which use "code units". It makes a difference in string with fun unicode characters.
        const matchStr = sliceCodePoints(
          match.context,
          match.contextStart.column,
          match.contextEnd.column
        );
        return {
          type: "MATCH",
          column: match.location.column,
          line: match.location.line,
          sourceId,
          match: matchStr,
          matchIndex: match.context.indexOf(matchStr),
          value: match.context,
        };
      }),
    };
  });
};

function getFilePath(item, index) {
  return item.type === "RESULT"
    ? `${item.sourceId}-${index || "$"}`
    : `${item.sourceId}-${item.line}-${item.column}-${index || "$"}`;
}

function sanitizeQuery(query) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

export class ProjectSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: this.props.query || "",
      inputFocused: false,
      focusedItem: null,
      results: {
        status: "DONE",
        query: "",
        matchesBySource: [],
      },
    };
  }

  componentDidMount() {
    const { globalShortcuts, shortcuts } = this.context;
    globalShortcuts.on("CmdOrCtrl+Shift+F", this.toggleProjectTextSearch);
    shortcuts.on("Enter", this.onEnterPress);
  }

  componentWillUnmount() {
    const { globalShortcuts, shortcuts } = this.context;
    globalShortcuts.off("CmdOrCtrl+Shift+F", this.toggleProjectTextSearch);
    shortcuts.off("Enter", this.onEnterPress);
  }

  componentDidUpdate(prevProps) {
    // If the query changes in redux, also change it in the UI
    if (prevProps.query !== this.props.query) {
      this.setState({ inputValue: this.props.query });
    }
  }

  async doSearch(query) {
    trackEvent("project_search.search");

    const updateResults = getNextResults => {
      this.setState(prevState => ({
        results: {
          ...prevState.results,
          ...getNextResults(prevState.results),
        },
      }));
    };

    updateResults(() => ({ status: "LOADING", query, matchesBySource: [] }));

    await ThreadFront.searchSources({ query }, matches => {
      const { sourcesById } = this.props;
      const bestMatches = matches.filter(match => {
        const { sourceId } = match.location;
        const source = sourcesById[sourceId];
        return !ThreadFront.isMinifiedSource(sourceId) && !isThirdParty(source);
      });
      const newMatchesBySource = formatMatchesBySource(bestMatches, sourcesById);
      updateResults(prevResults => ({
        matchesBySource: [...prevResults.matchesBySource, ...newMatchesBySource],
      }));
    });

    updateResults(() => ({ status: "DONE" }));
  }

  toggleProjectTextSearch = e => {
    const { cx, closeProjectSearch, setActiveSearch } = this.props;
    if (e) {
      e.preventDefault();
    }

    if (this.isProjectSearchEnabled()) {
      return closeProjectSearch(cx);
    }

    return setActiveSearch("project");
  };

  isProjectSearchEnabled = () => this.props.activeSearch === "project";

  selectMatchItem = matchItem => {
    trackEvent("project_search.select");

    this.props.selectSpecificLocation(this.props.cx, {
      sourceId: matchItem.sourceId,
      line: matchItem.line,
      column: matchItem.column,
    });
    this.props.doSearchForHighlight(
      this.state.inputValue,
      getEditor(),
      matchItem.line,
      matchItem.column
    );
  };

  onKeyDown = e => {
    if (e.key === "Escape") {
      return;
    }

    e.stopPropagation();

    if (e.key !== "Enter") {
      return;
    }
    this.setState({ focusedItem: null });
    const query = sanitizeQuery(this.state.inputValue);
    if (query && query !== this.state.query && query.length >= 3) {
      this.doSearch(query);
    }
  };

  onHistoryScroll = query => {
    this.setState({ inputValue: query });
  };

  onEnterPress = () => {
    if (!this.isProjectSearchEnabled() || !this.state.focusedItem || this.state.inputFocused) {
      return;
    }
    if (this.state.focusedItem.type === "MATCH") {
      this.selectMatchItem(this.state.focusedItem);
    }
  };

  onFocus = item => {
    if (this.state.focusedItem !== item) {
      this.setState({ focusedItem: item });
    }
  };

  inputOnChange = e => {
    const inputValue = e.target.value;
    const { cx, clearSearch } = this.props;
    this.setState({ inputValue });
    if (inputValue === "") {
      clearSearch(cx);
    }
  };

  renderFile = (file, focused, expanded) => {
    const matchesLength = file.matches.length;
    const matches = ` (${matchesLength} match${matchesLength > 1 ? "es" : ""})`;

    return (
      <div className={classnames("file-result", { focused })} key={file.sourceId}>
        <AccessibleImage className={classnames("arrow", { expanded })} />
        <AccessibleImage className="file" />
        <span className="file-path">{getRelativePath(file.filepath)}</span>
        <span className="matches-summary">{matches}</span>
      </div>
    );
  };

  renderMatch = (match, focused) => {
    return (
      <div
        className={classnames("result pl-4", { focused })}
        onClick={() => this.selectMatchItem(match)}
      >
        {highlightMatches(match)}
      </div>
    );
  };

  renderItem = (item, depth, focused, _, expanded) => {
    if (item.type === "RESULT") {
      return this.renderFile(item, focused, expanded);
    }
    return this.renderMatch(item, focused);
  };

  renderSummary() {
    const { results } = this.state;
    const { status, matchesBySource } = results;

    if (status !== "DONE") {
      return null;
    }

    const totalMatches = matchesBySource.reduce(
      (count, sourceMatch) => sourceMatch.matches.length + count,
      0
    );

    return (
      <div className="whitespace-pre pl-2">
        {new Intl.NumberFormat().format(totalMatches)} result{totalMatches === 1 ? "" : "s"}
      </div>
    );
  }

  renderResults = () => {
    const { results } = this.state;
    const { status, matchesBySource } = results;
    if (!results.query) {
      return;
    }

    if (!matchesBySource.length) {
      const msg = status === "LOADING" ? "Loading\u2026" : "No results found";
      return <div className="px-2">{msg}</div>;
    }

    return (
      <div className="overflow-hidden px-2 flex flex-col">
        {this.renderSummary()}
        <div className="h-full overflow-y-auto">
          <ManagedTree
            getRoots={() => matchesBySource}
            getChildren={file => file.matches || []}
            itemHeight={24}
            autoExpandAll={true}
            autoExpandDepth={1}
            autoExpandNodeChildrenLimit={100}
            getParent={item => null}
            getPath={getFilePath}
            renderItem={this.renderItem}
            focused={this.state.focusedItem}
            onFocus={this.onFocus}
          />
        </div>
      </div>
    );
  };

  renderInput() {
    const { results } = this.state;
    const { status } = results;

    return (
      <div className="p-2">
        <div className="px-2 py-1 border-0 bg-gray-100 rounded-md flex items-center space-x-2">
          <MaterialIcon>search</MaterialIcon>
          <input
            style={{ boxShadow: "unset" }}
            placeholder="Find in files…"
            className="border-0 bg-transparent p-0 flex-grow text-xs focus:outline-none"
            type="text"
            value={this.state.inputValue}
            onChange={this.inputOnChange}
            onFocus={() => this.setState({ inputFocused: true })}
            onBlur={() => this.setState({ inputFocused: false })}
            onKeyDown={this.onKeyDown}
            autoFocus
          />
          {status === "LOADING" ? <Spinner className="animate-spin h-4 w-4" /> : null}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="search-container">
        <div className="project-text-search">
          <div className="header">{this.renderInput()}</div>
          {this.renderResults()}
        </div>
      </div>
    );
  }
}
ProjectSearch.contextTypes = {
  globalShortcuts: PropTypes.object,
  shortcuts: PropTypes.object,
};

const mapStateToProps = state => ({
  cx: getContext(state),
  activeSearch: getActiveSearch(state),
  results: getTextSearchResults(state),
  query: getTextSearchQuery(state),
  sourcesById: getSources(state).values,
  status: getTextSearchStatus(state),
});

export default connect(mapStateToProps, {
  closeProjectSearch: actions.closeProjectSearch,
  searchSources: actions.searchSources,
  clearSearch: actions.clearSearch,
  selectSpecificLocation: actions.selectSpecificLocation,
  setActiveSearch: actions.setActiveSearch,
  doSearchForHighlight: actions.doSearchForHighlight,
})(ProjectSearch);
