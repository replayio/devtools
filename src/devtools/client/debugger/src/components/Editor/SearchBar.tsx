/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";

import { CloseButton } from "../shared/Button";
import AccessibleImage from "../shared/AccessibleImage";
import actions from "../../actions";
import {
  getActiveSearch,
  getFileSearchQuery,
  getFileSearchModifiers,
  getFileSearchResults,
  getContext,
} from "../../selectors";
import { getSelectedSource, getSourceContent, isFulfilled } from "ui/reducers/sources";

import { removeOverlay } from "../../utils/editor";

import { scrollList } from "../../utils/result-list";
import classnames from "classnames";

import SearchInput from "../shared/SearchInput";
import debounce from "lodash/debounce";
import { PluralForm } from "devtools/shared/plural-form";

import type { Modifiers } from "devtools/client/debugger/src/reducers/file-search";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

function getShortcuts() {
  const searchAgainKey = "Cmd+G";
  const searchAgainPrevKey = "Cmd+Shift+G";
  const searchKey = "CmdOrCtrl+F";

  return {
    shiftSearchAgainShortcut: searchAgainPrevKey,
    searchAgainShortcut: searchAgainKey,
    searchShortcut: searchKey,
  };
}

interface SMBProps {
  modifiers: Modifiers;
  className: string;
  modVal: keyof Modifiers;
  svgName: string;
  tooltip: string;
  toggleFileSearchModifier: (cx: Context, modVal: keyof Modifiers) => void;
  doSearch: (query: string) => void;
  query: string;
  cx: Context;
}

function SearchModBtn({
  modifiers,
  modVal,
  className,
  svgName,
  tooltip,
  toggleFileSearchModifier,
  doSearch,
  query,
  cx,
}: SMBProps) {
  const preppedClass = classnames(className, {
    active: modifiers && modifiers[modVal],
  });
  return (
    <button
      className={preppedClass}
      onMouseDown={() => {
        toggleFileSearchModifier(cx, modVal);
        doSearch(query);
      }}
      onKeyDown={e => {
        if (e.key === "Enter") {
          toggleFileSearchModifier(cx, modVal);
          doSearch(query);
        }
      }}
      title={tooltip}
    >
      <AccessibleImage className={svgName} />
    </button>
  );
}

const mapStateToProps = (state: UIState) => {
  const selectedSource = getSelectedSource(state);

  return {
    cx: getContext(state),
    searchOn: getActiveSearch(state) === "file",
    selectedSource,
    selectedContentLoaded: selectedSource
      ? isFulfilled(getSourceContent(state, selectedSource.id))
      : false,
    query: getFileSearchQuery(state),
    modifiers: getFileSearchModifiers(state),
    searchResults: getFileSearchResults(state),
  };
};

const connector = connect(mapStateToProps, {
  toggleFileSearchModifier: actions.toggleFileSearchModifier,
  setFileSearchQuery: actions.setFileSearchQuery,
  setActiveSearch: actions.setActiveSearch,
  closeFileSearch: actions.closeFileSearch,
  doSearch: actions.doSearch,
  traverseResults: actions.traverseResults,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

interface SBProps {
  editor: any;
  showClose?: boolean;
  size?: string;
}

type FinalSBProps = PropsFromRedux & SBProps;

interface SBState {
  query: string;
  selectedResultIndex: number;
  count: number;
  index: number;
  inputFocused: boolean;
}

class SearchBar extends Component<FinalSBProps, SBState> {
  constructor(props: FinalSBProps) {
    super(props);
    this.state = {
      query: props.query,
      selectedResultIndex: 0,
      count: 0,
      index: -1,
      inputFocused: false,
    };
  }

  componentWillUnmount() {
    // @ts-expect-error old context who cares
    const shortcuts = this.context.shortcuts;
    const { searchShortcut, searchAgainShortcut, shiftSearchAgainShortcut } = getShortcuts();

    shortcuts.off(searchShortcut);
    shortcuts.off("Escape");
    shortcuts.off(searchAgainShortcut);
    shortcuts.off(shiftSearchAgainShortcut);
  }

  componentDidMount() {
    // overwrite this.doSearch with debounced version to
    // reduce frequency of queries
    this.doSearch = debounce(this.doSearch, 100);
    // @ts-expect-error old context who cares
    const shortcuts = this.context.shortcuts;
    const { searchShortcut, searchAgainShortcut, shiftSearchAgainShortcut } = getShortcuts();

    // Not actually React events but whatever
    shortcuts.on(searchShortcut, (e: React.KeyboardEvent) => this.toggleSearch(e));
    shortcuts.on("Escape", (e: React.KeyboardEvent) => this.onEscape(e));

    shortcuts.on(shiftSearchAgainShortcut, (e: React.KeyboardEvent) =>
      this.traverseResults(e, true)
    );

    shortcuts.on(searchAgainShortcut, (e: React.KeyboardEvent) => this.traverseResults(e, false));
  }

  componentDidUpdate() {
    // @ts-expect-error string refs ugh!
    if (this.refs.resultList && this.refs.resultList.refs) {
      // @ts-expect-error string refs ugh!
      scrollList(this.refs.resultList.refs, this.state.selectedResultIndex);
    }
  }

  onEscape = (e: React.KeyboardEvent) => {
    this.closeSearch(e);
  };

  clearSearch = () => {
    const { editor: ed, query } = this.props;
    if (ed) {
      const ctx = { ed, cm: ed.codeMirror };
      removeOverlay(ctx, query);
    }
  };

  closeSearch = (e: React.KeyboardEvent) => {
    const { cx, closeFileSearch, editor, searchOn, query } = this.props;
    this.clearSearch();
    if (editor && searchOn) {
      closeFileSearch(cx, editor);
      e.stopPropagation();
      e.preventDefault();
    }
    this.setState({ query, inputFocused: false });
  };

  toggleSearch = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { editor, searchOn, setActiveSearch } = this.props;

    // Set inputFocused to false, so that search query is highlighted whenever search shortcut is used, even if the input already has focus.
    this.setState({ inputFocused: false });

    if (!searchOn) {
      setActiveSearch("file");
    }

    if (this.props.searchOn && editor) {
      const query = editor.codeMirror.getSelection() || this.state.query;

      if (query !== "") {
        this.setState({ query, inputFocused: true });
        this.doSearch(query);
      } else {
        this.setState({ query: "", inputFocused: true });
      }
    }
  };

  doSearch = (query: string) => {
    const { cx, selectedSource, selectedContentLoaded } = this.props;
    if (!selectedSource || !selectedContentLoaded) {
      return;
    }

    this.props.doSearch(cx, query, this.props.editor);
  };

  traverseResults = (e: React.KeyboardEvent, reverse: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const editor = this.props.editor;

    if (!editor) {
      return;
    }
    this.props.traverseResults(this.props.cx, reverse, editor);
  };

  // Handlers

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ query: e.target.value });

    return this.doSearch(e.target.value);
  };

  onFocus = (e: React.KeyboardEvent) => {
    this.setState({ inputFocused: true });
  };

  onBlur = (e: React.KeyboardEvent) => {
    this.setState({ inputFocused: false });
  };

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== "F3") {
      return;
    }

    this.traverseResults(e, e.shiftKey);
    e.preventDefault();
    return this.doSearch((e.target as HTMLInputElement).value);
  };

  onHistoryScroll = (query: string) => {
    this.setState({ query });
    this.doSearch(query);
  };

  // Renderers
  buildSummaryMsg() {
    const {
      searchResults: { matchIndex, count, index },
      query,
    } = this.props;

    if (query.trim() == "") {
      return "";
    }

    if (count == 0) {
      return "No results found";
    }

    if (index == -1) {
      const resultsSummaryString = "#1 result;#1 results";
      return PluralForm.get(count, resultsSummaryString).replace("#1", count);
    }

    const searchResultsString = "%d of #1 result;%d of #1 results";
    return PluralForm.get(count, searchResultsString)
      .replace("#1", count)
      .replace("%d", matchIndex + 1);
  }

  renderSearchModifiers = () => {
    const { cx, modifiers, toggleFileSearchModifier, query } = this.props;
    const { doSearch } = this;

    const commonProps = {
      cx,
      modifiers,
      toggleFileSearchModifier,
      query,
      doSearch,
    };

    return (
      <div className="search-modifiers">
        <span className="pipe-divider" />
        <span className="search-type-name">{"Modifiers:"}</span>
        <SearchModBtn
          {...commonProps}
          modVal="regexMatch"
          className="regex-match-btn"
          svgName="regex-match"
          tooltip={"Regex"}
        />
        <SearchModBtn
          {...commonProps}
          modVal="caseSensitive"
          className="case-sensitive-btn"
          svgName="case-match"
          tooltip={"Case sensitive"}
        />
        <SearchModBtn
          {...commonProps}
          modVal="wholeWord"
          className="whole-word-btn"
          svgName="whole-word-match"
          tooltip={"Whole word"}
        />
      </div>
    );
  };

  shouldShowErrorEmoji() {
    const {
      query,
      searchResults: { count },
    } = this.props;
    return !!query && !count;
  }

  render() {
    const {
      searchResults: { count },
      searchOn,
      showClose = true,
      size = "big",
    } = this.props;

    if (!searchOn) {
      return <div />;
    }

    return (
      <div className="search-bar">
        <SearchInput
          query={this.state.query}
          count={count}
          placeholder={"Find in file…"}
          summaryMsg={this.buildSummaryMsg()}
          isLoading={false}
          onChange={this.onChange}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          showErrorEmoji={this.shouldShowErrorEmoji()}
          onKeyDown={this.onKeyDown}
          onHistoryScroll={this.onHistoryScroll}
          handleNext={(e: React.KeyboardEvent) => this.traverseResults(e, false)}
          handlePrev={(e: React.KeyboardEvent) => this.traverseResults(e, true)}
          shouldFocus={this.state.inputFocused}
          showClose={false}
        />
        <div className="search-bottom-bar">
          {this.renderSearchModifiers()}
          {showClose && (
            <React.Fragment>
              <span className="pipe-divider" />
              <CloseButton handleClick={this.closeSearch} buttonClass={size} tooltip="" />
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

// @ts-expect-error contextTypes shenanigans
SearchBar.contextTypes = {
  shortcuts: PropTypes.object,
};
export default connector(SearchBar);
