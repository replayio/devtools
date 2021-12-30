/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, createRef } from "react";
import { connect } from "../../utils/connect";
import actions from "../../actions";

import { getEditor } from "../../utils/editor";
import {
  getContext,
  getSources,
  getFullTextSearchQuery,
  getFullTextSearchFocus,
} from "../../selectors";

import { trackEvent } from "ui/utils/telemetry";
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
      status: "DONE",
      query: "",
      matchesBySource: [],
    },
  };

  componentDidMount() {
    this.searchRef = createRef();
  }

  selectMatchItem = matchItem => {
    const { query, cx, doSearchForHighlight, selectSpecificLocation } = this.props;
    trackEvent("project_search.select");

    selectSpecificLocation(cx, {
      sourceId: matchItem.sourceId,
      line: matchItem.line,
      column: matchItem.column,
    });

    setTimeout(
      () => doSearchForHighlight(query, getEditor(), matchItem.line, matchItem.column),
      20
    );
  };

  onKeyDown = e => {
    const { sourcesById, setFullTextQuery, query } = this.props;

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
      search(sanitizedQuery, sourcesById, updateResults);
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
    const { results, focusedItem } = this.state;
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
  sourcesById: getSources(state).values,
  query: getFullTextSearchQuery(state),
  focused: getFullTextSearchFocus(state),
});

export default connect(mapStateToProps, {
  focusFullTextInput: actions.focusFullTextInput,
  setFullTextQuery: actions.setFullTextQuery,
  selectSpecificLocation: actions.selectSpecificLocation,
  doSearchForHighlight: actions.doSearchForHighlight,
})(FullTextSearch);
