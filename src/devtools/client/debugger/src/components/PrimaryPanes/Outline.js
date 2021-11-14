/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import { showMenu } from "devtools-contextmenu";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { connect } from "../../utils/connect";
const classnames = require("classnames");

import { findClosestEnclosedSymbol } from "../../utils/ast";
import { fuzzySearch } from "../../utils/function";
import { copyToTheClipboard } from "../../utils/clipboard";
import { findFunctionText } from "../../utils/function";
import { getTruncatedFileName } from "../../utils/source";
import { Redacted } from "ui/components/Redacted";
import { trackEvent } from "ui/utils/telemetry";

import actions from "../../actions";
import {
  getSelectedSourceWithContent,
  getSymbols,
  getCursorPosition,
  getContext,
} from "../../selectors";

import OutlineFilter from "./OutlineFilter";
import PreviewFunction from "../shared/PreviewFunction";
import uniq from "lodash/uniq";

// Checks if an element is visible inside its parent element
function isVisible(element, parent) {
  const parentTop = parent.getBoundingClientRect().top;
  const parentBottom = parent.getBoundingClientRect().bottom;
  const elTop = element.getBoundingClientRect().top;
  const elBottom = element.getBoundingClientRect().bottom;
  return parentTop < elTop && parentBottom > elBottom;
}

export class Outline extends Component {
  focusedElRef;
  state = { filter: "", focusedItem: null, functions: [], namedFunctions: [] };
  focusedElRef = null;

  componentDidMount() {
    this.updateSymbols("");
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.cursorPosition &&
      this.props.symbols &&
      this.props.cursorPosition !== prevProps.cursorPosition
    ) {
      this.setFocus(this.props.cursorPosition);
    }

    if (this.props.symbols != prevProps.symbols) {
      this.updateSymbols(this.state.filter);
    }

    //confirm we aren't rescrolling back up the outline panel unnecessarily
    const isUniqueEvent = prevState.focusedItem !== this.state.focusedItem;

    if (
      this.focusedElRef &&
      isUniqueEvent &&
      !isVisible(this.focusedElRef, this.refs.outlineList)
    ) {
      this.focusedElRef.scrollIntoView({ block: "center" });
    }
  }

  setFocus(cursorPosition) {
    const { symbols } = this.props;
    const closestItem = findClosestEnclosedSymbol(symbols, cursorPosition);

    this.setState({ focusedItem: closestItem });
  }

  selectItem(selectedItem) {
    const { cx, selectedSource, selectLocation } = this.props;
    if (!selectedSource || !selectedItem) {
      return;
    }

    selectLocation(cx, {
      sourceId: selectedSource.id,
      line: selectedItem.location.start.line,
      column: selectedItem.location.start.column,
    });

    this.setState({ focusedItem: selectedItem });
  }

  updateSymbols(filter) {
    const { symbols } = this.props;

    if (!symbols || !symbols.functions) {
      this.setState({ classes: [], namedFunctions: [], functions: [] });
      return;
    }
    const functions = symbols.functions.filter(func => func.name != "anonymous");

    let classes = uniq(functions.map(func => func.klass));

    let namedFunctions = functions.filter(
      func => fuzzySearch(func.name, filter) && !func.klass && !classes.includes(func.name)
    );

    console.log({ namedFunctions });
    this.setState({ classes, namedFunctions, functions });
  }

  updateFilter = filter => {
    const newFilter = filter.trim();
    this.setState({ filter: newFilter });
    this.updateSymbols(newFilter);
  };

  renderPlaceholder() {
    const placeholderMessage = this.props.selectedSource ? "No functions" : "No file selected";

    return <div className="outline-pane-info">{placeholderMessage}</div>;
  }

  renderLoading() {
    return (
      <div className="outline-pane-info">
        {this.props.selectedSource
          ? getTruncatedFileName(this.props.selectedSource, "")
          : "Loading..."}
      </div>
    );
  }

  renderFunction(func) {
    const { focusedItem } = this.state;
    const { name, location, parameterNames } = func;
    const isFocused = focusedItem === func;

    return (
      <li
        key={`${name}:${location.start.line}:${location.start.column}`}
        className={classnames("outline-list__element", { focused: isFocused })}
        ref={el => {
          if (isFocused) {
            this.focusedElRef = el;
          }
        }}
        onClick={() => {
          trackEvent("outline.select");
          this.selectItem(func);
        }}
      >
        <span className="outline-list__element-icon">λ</span>
        <Redacted className="inline-block">
          <PreviewFunction func={{ name, parameterNames }} />
        </Redacted>
      </li>
    );
  }

  renderClassHeader(klass) {
    return (
      <div>
        <span className="keyword">class</span> {klass}
      </div>
    );
  }

  renderClassFunctions(klass, functions) {
    const { symbols } = this.props;

    if (!symbols || symbols.loading || klass == null || functions.length == 0) {
      return null;
    }

    const { focusedItem } = this.state;
    const classFunc = functions.find(func => func.name === klass);
    const classFunctions = functions.filter(func => func.klass === klass);
    const classInfo = symbols.classes.find(c => c.name === klass);

    const item = classFunc || classInfo;
    const isFocused = focusedItem === item;

    return (
      <li
        className="outline-list__class"
        ref={el => {
          if (isFocused) {
            this.focusedElRef = el;
          }
        }}
        key={klass}
      >
        <h2
          className={classnames("", { focused: isFocused })}
          onClick={() => this.selectItem(item)}
        >
          {classFunc ? this.renderFunction(classFunc) : this.renderClassHeader(klass)}
        </h2>
        <ul className="outline-list__class-list">
          {classFunctions.map(func => this.renderFunction(func))}
        </ul>
      </li>
    );
  }

  renderFunctions(functions) {
    const { filter } = this.state;
    let classes = uniq(functions.map(func => func.klass));
    let namedFunctions = functions.filter(
      func => filterOutlineItem(func.name, filter) && !func.klass && !classes.includes(func.name)
    );

    let classFunctions = functions.filter(
      func => filterOutlineItem(func.name, filter) && !!func.klass
    );

    return (
      <ul ref="outlineList" className="outline-list devtools-monospace" dir="ltr">
        {namedFunctions.map(func => this.renderFunction(func))}
      </ul>
    );
  }

  render() {
    const { symbols, selectedSource } = this.props;
    const { functions, namedFunctions } = this.state;

    const { filter } = this.state;

    if (!selectedSource) {
      return this.renderPlaceholder();
    }

    if (!symbols || symbols.loading) {
      return this.renderLoading();
    }

    if (functions.length === 0) {
      return this.renderPlaceholder();
    }

    const Row = ({ index, style }) => <div style={style}>Row {index}</div>;

    return (
      <div className="outline">
        <div className="outline__container">
          <AutoSizer>
            {({ height, width }) => (
              <>
                <OutlineFilter filter={filter} updateFilter={this.updateFilter} />
                <List
                  height={height - 100}
                  itemCount={namedFunctions.length}
                  itemSize={20}
                  width={width}
                >
                  {({ index }) => this.renderFunction(namedFunctions[index])}
                </List>
              </>
            )}
          </AutoSizer>
        </div>
      </div>
    );

    return (
      <div className="outline">
        <div className="outline__container space-y-2">
          <OutlineFilter filter={filter} updateFilter={this.updateFilter} />
          {this.renderFunctions(symbolsToDisplay)}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const selectedSource = getSelectedSourceWithContent(state);
  const symbols = selectedSource ? getSymbols(state, selectedSource) : null;

  return {
    cx: getContext(state),
    symbols,
    selectedSource: selectedSource,
    cursorPosition: getCursorPosition(state),
    getFunctionText: line => {
      if (selectedSource) {
        return findFunctionText(line, selectedSource, symbols);
      }

      return null;
    },
  };
};

export default connect(mapStateToProps, {
  selectLocation: actions.selectLocation,
  flashLineRange: actions.flashLineRange,
})(Outline);
