/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import { CloseButton } from "../shared/Button";
import AccessibleImage from "../shared/AccessibleImage";
import actions from "../../actions";
import {
  getActiveSearch,
  getSelectedSource,
  getSourceContent,
  getFileSearchQuery,
  getFileSearchModifiers,
  getFileSearchResults,
  getContext,
} from "../../selectors";

import { removeOverlay } from "../../utils/editor";

import { scrollList } from "../../utils/result-list";
import classnames from "classnames";

import SearchInput from "../shared/SearchInput";
import debounce from "lodash/debounce";
import { PluralForm } from "devtools/shared/plural-form";

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

class SearchBar extends Component {
  constructor(props) {
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
    const shortcuts = this.context.shortcuts;
    const { searchShortcut, searchAgainShortcut, shiftSearchAgainShortcut } = getShortcuts();

    shortcuts.on(searchShortcut, e => this.toggleSearch(e));
    shortcuts.on("Escape", e => this.onEscape(e));

    shortcuts.on(shiftSearchAgainShortcut, e => this.traverseResults(e, true));

    shortcuts.on(searchAgainShortcut, e => this.traverseResults(e, false));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.refs.resultList && this.refs.resultList.refs) {
      scrollList(this.refs.resultList.refs, this.state.selectedResultIndex);
    }
  }

  onEscape = e => {
    this.closeSearch(e);
  };

  clearSearch = () => {
    const { editor: ed, query } = this.props;
    if (ed) {
      const ctx = { ed, cm: ed.codeMirror };
      removeOverlay(ctx, query);
    }
  };

  closeSearch = e => {
    const { cx, closeFileSearch, editor, searchOn, query } = this.props;
    this.clearSearch();
    if (editor && searchOn) {
      closeFileSearch(cx, editor);
      e.stopPropagation();
      e.preventDefault();
    }
    this.setState({ query, inputFocused: false });
  };

  toggleSearch = e => {
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

  doSearch = query => {
    const { cx, selectedSource, selectedContentLoaded } = this.props;
    if (!selectedSource || !selectedContentLoaded) {
      return;
    }

    this.props.doSearch(cx, query, this.props.editor);
  };

  traverseResults = (e, rev) => {
    e.stopPropagation();
    e.preventDefault();
    const editor = this.props.editor;

    if (!editor) {
      return;
    }
    this.props.traverseResults(this.props.cx, rev, editor);
  };

  // Handlers

  onChange = e => {
    this.setState({ query: e.target.value });

    return this.doSearch(e.target.value);
  };

  onFocus = e => {
    this.setState({ inputFocused: true });
  };

  onBlur = e => {
    this.setState({ inputFocused: false });
  };

  onKeyDown = e => {
    if (e.key !== "Enter" && e.key !== "F3") {
      return;
    }

    this.traverseResults(e, e.shiftKey);
    e.preventDefault();
    return this.doSearch(e.target.value);
  };

  onHistoryScroll = query => {
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

    function SearchModBtn({ modVal, className, svgName, tooltip }) {
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

    return (
      <div className="search-modifiers">
        <span className="pipe-divider" />
        <span className="search-type-name">{"Modifiers:"}</span>
        <SearchModBtn
          modVal="regexMatch"
          className="regex-match-btn"
          svgName="regex-match"
          tooltip={"Regex"}
        />
        <SearchModBtn
          modVal="caseSensitive"
          className="case-sensitive-btn"
          svgName="case-match"
          tooltip={"Case sensitive"}
        />
        <SearchModBtn
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
          handleNext={e => this.traverseResults(e, false)}
          handlePrev={e => this.traverseResults(e, true)}
          shouldFocus={this.state.inputFocused}
          showClose={false}
        />
        <div className="search-bottom-bar">
          {this.renderSearchModifiers()}
          {showClose && (
            <React.Fragment>
              <span className="pipe-divider" />
              <CloseButton handleClick={this.closeSearch} buttonClass={size} />
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

SearchBar.contextTypes = {
  shortcuts: PropTypes.object,
};

const mapStateToProps = (state, p) => {
  const selectedSource = getSelectedSource(state);

  return {
    cx: getContext(state),
    searchOn: getActiveSearch(state) === "file",
    selectedSource,
    selectedContentLoaded: selectedSource ? !!getSourceContent(state, selectedSource.id) : false,
    query: getFileSearchQuery(state),
    modifiers: getFileSearchModifiers(state),
    searchResults: getFileSearchResults(state),
  };
};

export default connect(mapStateToProps, {
  toggleFileSearchModifier: actions.toggleFileSearchModifier,
  setFileSearchQuery: actions.setFileSearchQuery,
  setActiveSearch: actions.setActiveSearch,
  closeFileSearch: actions.closeFileSearch,
  doSearch: actions.doSearch,
  traverseResults: actions.traverseResults,
})(SearchBar);
