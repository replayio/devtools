/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect } from "../../utils/connect";

import { findClosestEnclosedSymbol } from "../../utils/ast";
import Spinner from "ui/components/shared/Spinner";

import actions from "../../actions";
import {
  getSelectedSourceWithContent,
  getSymbols,
  getCursorPosition,
  getContext,
} from "../../selectors";

import OutlineFilter from "../PrimaryPanes/OutlineFilter";
import uniq from "lodash/uniq";
import { isVisible } from "ui/utils/dom";
import { OutlineFunction } from "./OutlineFunction";
import { filterOutlineItem } from "./filterOutlineItem";
import { ClassFunctionsList } from "./ClassFunctionsList";
import memoize from "lodash/memoize";

export const getFunctionKey = ({ name, location }) =>
  `${name}:${location.start.line}:${location.start.column}`;

const findNamedFunctions = memoize(function findNamedFunctions(filter, functions) {
  let classes = uniq(functions.map(func => func.klass));

  const namedFunctions = functions
    .filter(
      func => filterOutlineItem(func.name, filter) && !func.klass && !classes.includes(func.name)
    )
    .slice(0, 500);

  return { namedFunctions, classes };
});

export class Outline extends Component {
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
      !isVisible(this.refs.outlineList, this.focusedElRef)
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

  renderFunctions(functions) {
    const { filter, focusedItem } = this.state;
    let { namedFunctions, classes } = findNamedFunctions(filter, functions);

    return (
      <ul ref="outlineList" className="outline-list devtools-monospace" dir="ltr">
        {namedFunctions.map(func => (
          <OutlineFunction
            key={getFunctionKey(func)}
            isFocused={focusedItem === func}
            func={func}
            onSelect={this.selectItem}
            outlineList={this.refs.outlineList}
          />
        ))}
        {classes.map((klass, i) => (
          <ClassFunctionsList
            key={i}
            klass={klass}
            filter={filter}
            symbols={this.props.symbols}
            functions={functions}
            onSelect={this.selectItem}
            focusedItem={focusedItem}
            outlineList={this.refs.outlineList}
          />
        ))}
      </ul>
    );
  }

  render() {
    const { symbols, selectedSource } = this.props;
    const { filter } = this.state;

    const placeholderMessage = this.props.selectedSource ? "No functions" : "No file selected";

    if (!selectedSource) {
      return <div className="outline-pane-info">{placeholderMessage}</div>;
    }

    if (!symbols || symbols.loading) {
      return (
        <div className="flex p-4 justify-center">
          <Spinner className="animate-spin h-4 w-4 text-gray-500" />
        </div>
      );
    }

    const symbolsToDisplay = symbols.functions.filter(func => func.name != "anonymous");

    if (symbolsToDisplay.length === 0) {
      return <div className="outline-pane-info">{placeholderMessage}</div>;
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
