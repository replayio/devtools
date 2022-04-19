/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, createRef } from "react";
import Checkbox from "ui/components/shared/Forms/Checkbox";
import { trackEvent } from "ui/utils/telemetry";

import actions from "../../actions";
import {
  getContext,
  getSources,
  getFullTextSearchQuery,
  getFullTextSearchFocus,
} from "../../selectors";
import { connect } from "../../utils/connect";
import { getEditor } from "../../utils/editor";

import { FullTextFilter } from "./FullTextFilter";
import { FullTextResults } from "./FullTextResults";
import { search } from "./search";

function sanitizeQuery(query) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

export class FullTextSearch extends Component {
  state = {
    focusedItem: null,
    results: {
      includeNodeModules: true,
      matchesBySource: [],
      query: "",
      status: "DONE",
    },
  };

  componentDidMount() {
    this.searchRef = createRef();
  }

  selectMatchItem = matchItem => {
    const { query, cx, doSearchForHighlight, selectSpecificLocation } = this.props;
    trackEvent("project_search.select");

    selectSpecificLocation(cx, {
      column: matchItem.column,
      line: matchItem.line,
      sourceId: matchItem.sourceId,
    });

    setTimeout(
      () => doSearchForHighlight(query, getEditor(), matchItem.line, matchItem.column),
      20
    );
  };

  onKeyDown = e => {
    const { sourcesById, setFullTextQuery, query } = this.props;
    const { includeNodeModules } = this.state;

    if (e.key === "ArrowDown") {
      trackEvent("project_search.go_to_first_result");
      this.searchRef.current.querySelector(".file-result:first-child").focus();
      e.preventDefault();
      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    const sanitizedQuery = sanitizeQuery(e.target.value);
    const updateResults = getNextResults => {
      this.setState(prevState => ({
        results: {
          ...prevState.results,
          ...getNextResults(prevState.results),
        },
      }));
    };

    setFullTextQuery(sanitizedQuery);
    this.setState({ focusedItem: null });
    if (sanitizedQuery && query !== this.state.query && sanitizedQuery.length >= 3) {
      search(sanitizedQuery, sourcesById, updateResults, includeNodeModules);
      return sanitizedQuery;
    }

    return null;
  };

  onFocus = item => {
    if (this.state.focusedItem !== item) {
      this.setState({ focusedItem: item });
    }

    if (item?.type === "MATCH") {
      this.selectMatchItem(item);
    }
  };

  render() {
    const { query, setFullTextQuery, focused, focusFullTextInput } = this.props;
    const { results, focusedItem, includeNodeModules } = this.state;
    return (
      <div ref={this.searchRef} className="search-container">
        <div className="project-text-search">
          <div className="header">
            <FullTextFilter
              value={query}
              focused={focused}
              setValue={setFullTextQuery}
              results={this.state.results}
              onKeyDown={this.onKeyDown}
              onSearch={this.onSearch}
              focusFullTextInput={focusFullTextInput}
            />
          </div>
          <label className="p-2 space-x-2 select-none" htmlFor="node-modules">
            <Checkbox
              id="node-modules"
              value={includeNodeModules}
              onChange={e => this.setState({ includeNodeModules: !includeNodeModules })}
            />
            <span>Include node modules</span>
          </label>
          <FullTextResults
            onItemSelect={item => this.selectMatchItem(item)}
            focusedItem={focusedItem}
            onFocus={this.onFocus}
            results={results}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  cx: getContext(state),
  focused: getFullTextSearchFocus(state),
  query: getFullTextSearchQuery(state),
  sourcesById: getSources(state).values,
});

export default connect(mapStateToProps, {
  doSearchForHighlight: actions.doSearchForHighlight,
  focusFullTextInput: actions.focusFullTextInput,
  selectSpecificLocation: actions.selectSpecificLocation,
  setFullTextQuery: actions.setFullTextQuery,
})(FullTextSearch);
