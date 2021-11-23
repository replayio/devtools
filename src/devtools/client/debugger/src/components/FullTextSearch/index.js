/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, createRef } from "react";
import { connect } from "../../utils/connect";
import actions from "../../actions";

import { getEditor } from "../../utils/editor";
import { getContext, getSources } from "../../selectors";

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
    inputValue: "",
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

    if (e.key === "ArrowDown") {
      trackEvent("project_search.go_to_first_result");
      this.searchRef.current.querySelector(".file-result:first-child").focus();
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
      search(query, sourcesById, updateResults);
      return query;
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
    const { results, focusedItem } = this.state;
    return (
      <div ref={this.searchRef} className="search-container">
        <div className="project-text-search">
          <div className="header">
            <FullTextFilter
              results={this.state.results}
              onKeyDown={this.onKeyDown}
              onSearch={this.onSearch}
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
});

export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
  doSearchForHighlight: actions.doSearchForHighlight,
})(FullTextSearch);
