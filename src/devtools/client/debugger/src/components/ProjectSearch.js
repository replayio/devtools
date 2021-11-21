/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component, useState } from "react";
import { connect } from "../utils/connect";
import classnames from "classnames";
import actions from "../actions";

import { getEditor } from "../utils/editor";
import { highlightMatches } from "../utils/project-search";

import { getRelativePath } from "../utils/sources-tree";
import { getContext, getSources } from "../selectors";

import ManagedTree from "./shared/ManagedTree";
import AccessibleImage from "./shared/AccessibleImage";

import { trackEvent } from "ui/utils/telemetry";
import { ThreadFront } from "protocol/thread";
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import { isThirdParty } from "../utils/source";
import { sliceCodePoints } from "ui/utils/codePointString";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import Spinner from "ui/components/shared/Spinner";

const formatSourceMatches = (source, matches) => ({
  type: "RESULT",
  sourceId: source.id,
  filepath: source.url,
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
      sourceId: source.id,
      match: matchStr,
      matchIndex: match.context.indexOf(matchStr),
      value: match.context,
    };
  }),
});

const formatMatchesBySource = (matches, sourcesById) => {
  const resultsBySource = groupBy(matches, res => res.location.sourceId);
  const filteredResults = Object.entries(resultsBySource)
    .map(([sourceId, matches]) => [sourcesById[sourceId], matches])
    .filter(([source]) => !!source);

  const sorted = sortBy(filteredResults, ([source]) => [source.isOriginal ? 0 : 1, source.url]);
  return sorted.map(([source, matches]) => formatSourceMatches(source, matches));
};

async function doSearch(query, sourcesById, updateResults) {
  trackEvent("project_search.search");

  updateResults(() => ({ status: "LOADING", query, matchesBySource: [] }));

  await ThreadFront.searchSources({ query }, matches => {
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

function getFilePath(item) {
  return item.type === "RESULT"
    ? `${item.sourceId}`
    : `${item.sourceId}-${item.line}-${item.column}`;
}

function sanitizeQuery(query) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

function FullTextSummary({ results }) {
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

function FullTextFilter({ results, onKeyDown }) {
  const { status } = results;
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="p-2">
      <div className="px-2 py-1 border-0 bg-gray-100 rounded-md flex items-center space-x-2">
        <MaterialIcon>search</MaterialIcon>
        <input
          style={{ boxShadow: "unset" }}
          placeholder="Find in files…"
          className="border-0 bg-transparent p-0 flex-grow text-xs focus:outline-none"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
        {status === "LOADING" ? <Spinner className="animate-spin h-4 w-4" /> : null}
      </div>
    </div>
  );
}

function FullTextItem({ item, focused, expanded, onSelect }) {
  if (item.type === "RESULT") {
    const matchesLength = item.matches.length;
    const matches = ` (${matchesLength} match${matchesLength > 1 ? "es" : ""})`;

    return (
      <div
        tabindex="0"
        className={classnames("file-result focus:outline-none", { focused })}
        key={item.sourceId}
      >
        <AccessibleImage className={classnames("arrow", { expanded })} />
        <AccessibleImage className="file" />
        <span className="file-path">{getRelativePath(item.filepath)}</span>
        <span className="matches-summary">{matches}</span>
      </div>
    );
  }

  return (
    <div className={classnames("result pl-4", { focused })} onClick={() => onSelect(item)}>
      {highlightMatches(item)}
    </div>
  );
}

export class ProjectSearch extends Component {
  state = {
    focusedItem: null,
    inputValue: "",
    results: {
      status: "DONE",
      query: "",
      matchesBySource: [],
    },
  };

  selectMatchItem = matchItem => {
    trackEvent("project_search.select");

    this.props.selectSpecificLocation(this.props.cx, {
      sourceId: matchItem.sourceId,
      line: matchItem.line,
      column: matchItem.column,
    });

    setTimeout(
      () =>
        this.props.doSearchForHighlight(
          this.state.inputValue,
          getEditor(),
          matchItem.line,
          matchItem.column
        ),
      20
    );
  };

  onKeyDown = e => {
    const { sourcesById } = this.props;

    if (e.key === "Escape") {
      return;
    }

    e.stopPropagation();

    if (e.key === "ArrowDown") {
      this.$results.querySelector(".file-result:first-child").focus();
      e.preventDefault();
      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    const query = sanitizeQuery(e.target.value);
    const updateResults = getNextResults => {
      this.setState(prevState => ({
        results: {
          ...prevState.results,
          ...getNextResults(prevState.results),
        },
      }));
    };

    this.setState({ focusedItem: null, inputValue: query });
    if (query && query !== this.state.query && query.length >= 3) {
      doSearch(query, sourcesById, updateResults);
    }
  };

  onFocus = item => {
    if (this.state.focusedItem !== item) {
      this.setState({ focusedItem: item });
    }

    if (item?.type === "MATCH") {
      this.selectMatchItem(item);
    }
  };

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
        <FullTextSummary results={results} onSearch={this.onSearch} />
        <div ref={r => (this.$results = r)} className="h-full overflow-y-auto">
          <ManagedTree
            getRoots={() => matchesBySource}
            getChildren={file => file.matches || []}
            itemHeight={24}
            autoExpandAll={true}
            autoExpandDepth={1}
            autoExpandNodeChildrenLimit={100}
            getParent={item => matchesBySource.find(source => source.sourceId === item.sourceId)}
            getPath={getFilePath}
            renderItem={(item, depth, focused, _, expanded) => (
              <FullTextItem
                item={item}
                focused={focused}
                expanded={expanded}
                onSelect={item => this.selectMatchItem(item)}
              />
            )}
            focused={this.state.focusedItem}
            onFocus={this.onFocus}
          />
        </div>
      </div>
    );
  };

  render() {
    return (
      <div className="search-container">
        <div className="project-text-search">
          <div className="header">
            <FullTextFilter results={this.state.results} onKeyDown={this.onKeyDown} />
          </div>
          {this.renderResults()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  cx: getContext(state),
  sourcesById: getSources(state).values,
});

export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
  doSearchForHighlight: actions.doSearchForHighlight,
})(ProjectSearch);
