/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component, PureComponent, useEffect, useRef } from "react";
import { showMenu } from "devtools-contextmenu";
import { connect } from "../../utils/connect";
import { score as fuzzaldrinScore } from "fuzzaldrin-plus";
const classnames = require("classnames");

import { findClosestEnclosedSymbol } from "../../utils/ast";
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

const getFunctionKey = ({ name, location }) =>
  `${name}:${location.start.line}:${location.start.column}`;
/**
 * Check whether the name argument matches the fuzzy filter argument
 */
const filterOutlineItem = (name, filter) => {
  // Set higher to make the fuzzaldrin filter more specific
  const FUZZALDRIN_FILTER_THRESHOLD = 15000;
  if (!filter) {
    return true;
  }

  if (filter.length === 1) {
    // when filter is a single char just check if it starts with the char
    return filter.toLowerCase() === name.toLowerCase()[0];
  }
  return fuzzaldrinScore(name, filter) > FUZZALDRIN_FILTER_THRESHOLD;
};

// Checks if an element is visible inside its parent element
function isVisible(element, parent) {
  const parentTop = parent.getBoundingClientRect().top;
  const parentBottom = parent.getBoundingClientRect().bottom;
  const elTop = element.getBoundingClientRect().top;
  const elBottom = element.getBoundingClientRect().bottom;
  return parentTop < elTop && parentBottom > elBottom;
}

const OutlineFunction = React.memo(function OutlineFunction({ isFocused, func, onSelect }) {
  const itemRef = useRef();
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "center" });
    }
  }, [isFocused]);
  return (
    <li
      className={classnames("outline-list__element", { focused: isFocused })}
      ref={itemRef}
      onClick={onSelect ? () => onSelect(func) : undefined}
    >
      <span className="outline-list__element-icon">λ</span>
      <Redacted className="inline-block">
        <PreviewFunction func={func} />
      </Redacted>
    </li>
  );
});

const OutlineClassFunctions = React.memo(function OutlineClassFunctions({
  classFunc,
  classInfo,
  isFocused,
  onSelect,
  children,
}) {
  const itemRef = useRef();
  useEffect(() => {
    if (isFocused && itemRef.current) {
      console.info("focus", itemRef.current);
      itemRef.current.scrollIntoView({ block: "center" });
    }
  }, [isFocused]);

  const item = classFunc || classInfo;

  return (
    <li className="outline-list__class" key={item.name}>
      <h2
        className={classnames("", { focused: isFocused })}
        onClick={() => onSelect(item)}
        ref={itemRef}
      >
        {classFunc ? (
          <OutlineFunction func={classFunc} isFocused={false} />
        ) : (
          <div>
            <span className="keyword">class</span> {item.name}
          </div>
        )}
      </h2>
      <ul className="outline-list__class-list">{children}</ul>
    </li>
  );
});
export class Outline extends PureComponent {
  state = { filter: "", focusedItem: null };
  scrollContainerRef = null;
  focusedElRef = null;

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.cursorPosition &&
      this.props.symbols &&
      this.props.cursorPosition !== prevProps.cursorPosition
    ) {
      this.setFocus(this.props.cursorPosition);
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

  selectItem = selectedItem => {
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
  };

  updateFilter = filter => {
    this.setState({ filter: filter.trim() });
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
    const isFocused = focusedItem === func;
    const key = getFunctionKey(func);

    return (
      <OutlineFunction key={key} isFocused={isFocused} func={func} onSelect={this.selectItem} />
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
      <OutlineClassFunctions classFunc={classFunc} classInfo={classInfo} isFocused={isFocused}>
        {classFunctions.map(func => this.renderFunction(func))}
      </OutlineClassFunctions>
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
        {classes.map(klass => this.renderClassFunctions(klass, classFunctions))}
      </ul>
    );
  }

  render() {
    const { symbols, selectedSource } = this.props;
    const { filter } = this.state;

    if (!selectedSource) {
      return this.renderPlaceholder();
    }

    if (!symbols || symbols.loading) {
      return this.renderLoading();
    }

    const symbolsToDisplay = symbols.functions.filter(func => func.name != "anonymous");

    if (symbolsToDisplay.length === 0) {
      return this.renderPlaceholder();
    }

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
  };
};

export default connect(mapStateToProps, {
  selectLocation: actions.selectLocation,
  flashLineRange: actions.flashLineRange,
})(Outline);
