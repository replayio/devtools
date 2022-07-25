/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, createRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { SearchSourceContentsMatch } from "@replayio/protocol";

import Checkbox from "ui/components/shared/Forms/Checkbox";
import { trackEvent } from "ui/utils/telemetry";
import { UIState } from "ui/state";

import { getSourceDetailsEntities, SourceDetails } from "ui/reducers/sources";
import actions from "../../actions";
import { getContext, getFullTextSearchQuery, getFullTextSearchFocus } from "../../selectors";

import { getEditor } from "../../utils/editor";

import { FullTextFilter } from "./FullTextFilter";
import { FullTextResults } from "./FullTextResults";
import { search } from "./search";

type $FixTypeLater = any;

function sanitizeQuery(query: string) {
  // no '\' at end of query
  return query.replace(/\\$/, "");
}

const mapStateToProps = (state: UIState) => ({
  cx: getContext(state),
  sourcesById: getSourceDetailsEntities(state),
  query: getFullTextSearchQuery(state),
  focused: getFullTextSearchFocus(state),
});

const connector = connect(mapStateToProps, {
  focusFullTextInput: actions.focusFullTextInput,
  setFullTextQuery: actions.setFullTextQuery,
  selectSpecificLocation: actions.selectSpecificLocation,
  doSearchForHighlight: actions.doSearchForHighlight,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

interface FTSState {
  focusedItem: SearchSourceContentsMatch | null;
  query: string;
  results: {
    status: "DONE";
    matchesBySource: $FixTypeLater[];
  };
  includeNodeModules: boolean;
}

export class FullTextSearch extends Component<PropsFromRedux, FTSState> {
  searchRef = createRef<HTMLDivElement>();
  state = {
    focusedItem: null,
    query: "",
    results: {
      status: "DONE" as const,
      matchesBySource: [],
    },
    includeNodeModules: true,
  };

  selectMatchItem = (matchItem: $FixTypeLater) => {
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

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { sourcesById, setFullTextQuery, query } = this.props;
    const { includeNodeModules } = this.state;

    if (e.key === "ArrowDown") {
      trackEvent("project_search.go_to_first_result");
      this.searchRef.current!.querySelector<HTMLElement>(".file-result:first-child")!.focus();
      e.preventDefault();
      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    // @ts-expect-error e.target.value doesn't exist
    const sanitizedQuery = sanitizeQuery(e.target.value);
    const updateResults = (getNextResults: (someResults: $FixTypeLater) => $FixTypeLater[]) => {
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
      search(
        sanitizedQuery,
        sourcesById as Record<string, SourceDetails>,
        updateResults,
        includeNodeModules
      );
      return sanitizedQuery;
    }

    return null;
  };

  onFocus = (item: $FixTypeLater) => {
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
              focusFullTextInput={focusFullTextInput}
            />
          </div>
          <label className="select-none space-x-2 p-2" htmlFor="node-modules">
            <Checkbox
              id="node-modules"
              checked={includeNodeModules}
              onChange={e => this.setState({ includeNodeModules: !includeNodeModules })}
            />
            <span>Include node modules</span>
          </label>
          <FullTextResults
            onItemSelect={(item: $FixTypeLater) => this.selectMatchItem(item)}
            focusedItem={focusedItem}
            onFocus={this.onFocus}
            results={results}
          />
        </div>
      </div>
    );
  }
}

export default connector(FullTextSearch);
