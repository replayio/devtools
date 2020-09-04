/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import { connect } from "../../utils/connect";
import classnames from "classnames";
import { features } from "../../utils/prefs";

import { objectInspector } from "devtools-reps";

import actions from "../../actions";
import {
  getExpressions,
  getExpressionError,
  getAutocompleteMatchset,
  getThreadContext,
} from "../../selectors";
import { getValue } from "../../utils/expressions";

import { CloseButton } from "../shared/Button";
import { debounce } from "lodash";

import "./Expressions.css";

const ObjectInspector = objectInspector.ObjectInspector.default;

class Expressions extends Component {
  _input;
  renderExpression;

  constructor(props) {
    super(props);

    this.state = {
      editing: false,
      editIndex: -1,
      inputValue: "",
      focused: false,
    };
  }

  componentDidMount() {
    const { showInput } = this.props;

    // Ensures that the input is focused when the "+"
    // is clicked while the panel is collapsed
    if (showInput && this._input) {
      this._input.focus();
    }
  }

  clear = () => {
    this.setState(() => {
      this.props.clearExpressionError();
      return { editing: false, editIndex: -1, inputValue: "", focused: false };
    });
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.state.editing && !nextProps.expressionError) {
      this.clear();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { editing, inputValue, focused } = this.state;
    const { expressions, expressionError, showInput, autocompleteMatches } = this.props;

    return (
      autocompleteMatches !== nextProps.autocompleteMatches ||
      expressions !== nextProps.expressions ||
      expressionError !== nextProps.expressionError ||
      editing !== nextState.editing ||
      inputValue !== nextState.inputValue ||
      nextProps.showInput !== showInput ||
      focused !== nextState.focused
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const input = this._input;

    if (!input) {
      return;
    }

    if (!prevState.editing && this.state.editing) {
      input.setSelectionRange(0, input.value.length);
      input.focus();
    } else if (this.props.showInput && !this.state.focused) {
      input.focus();
    }
  }

  editExpression(expression, index) {
    this.setState({
      inputValue: expression.input,
      editing: true,
      editIndex: index,
    });
  }

  deleteExpression(e, expression) {
    e.stopPropagation();
    const { deleteExpression } = this.props;
    deleteExpression(expression);
  }

  handleChange = e => {
    const { target } = e;
    if (features.autocompleteExpression) {
      this.findAutocompleteMatches(target.value, target.selectionStart);
    }
    this.setState({ inputValue: target.value });
  };

  findAutocompleteMatches = debounce((value, selectionStart) => {
    const { autocomplete } = this.props;
    autocomplete(this.props.cx, value, selectionStart);
  }, 250);

  handleKeyDown = e => {
    if (e.key === "Escape") {
      this.clear();
    }
  };

  hideInput = () => {
    this.setState({ focused: false });
    this.props.onExpressionAdded();
    this.props.clearExpressionError();
  };

  onFocus = () => {
    this.setState({ focused: true });
  };

  onBlur() {
    this.clear();
    this.hideInput();
  }

  handleExistingSubmit = async (e, expression) => {
    e.preventDefault();
    e.stopPropagation();

    this.props.updateExpression(this.props.cx, this.state.inputValue, expression);
    this.hideInput();
  };

  handleNewSubmit = async e => {
    const { inputValue } = this.state;
    e.preventDefault();
    e.stopPropagation();

    this.props.clearExpressionError();
    await this.props.addExpression(this.props.cx, this.state.inputValue);
    this.setState({
      editing: false,
      editIndex: -1,
      inputValue: this.props.expressionError ? inputValue : "",
    });

    if (!this.props.expressionError) {
      this.hideInput();
    }

    this.props.clearAutocomplete();
  };

  renderExpression = (expression, index) => {
    const {
      expressionError,
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
    } = this.props;

    const { editing, editIndex } = this.state;
    const { input, updating } = expression;
    const isEditingExpr = editing && editIndex === index;
    if (isEditingExpr || (isEditingExpr && expressionError)) {
      return this.renderExpressionEditInput(expression);
    }

    if (updating) {
      return;
    }

    let value = getValue(expression);

    const root = {
      name: expression.input,
      path: input,
      contents: value,
    };

    return (
      <li className="expression-container" key={input} title={expression.input}>
        <div className="expression-content">
          <ObjectInspector
            roots={[root]}
            autoExpandDepth={0}
            disableWrap={true}
            openLink={openLink}
            onDoubleClick={(items, { depth }) => {
              if (depth === 0) {
                this.editExpression(expression, index);
              }
            }}
            onDOMNodeClick={grip => openElementInInspector(grip)}
            onInspectIconClick={grip => openElementInInspector(grip)}
            onDOMNodeMouseOver={grip => highlightDomElement(grip)}
            onDOMNodeMouseOut={grip => unHighlightDomElement(grip)}
          />
          <div className="expression-container__close-btn">
            <CloseButton
              handleClick={e => this.deleteExpression(e, expression)}
              tooltip={L10N.getStr("expressions.remove.tooltip")}
            />
          </div>
        </div>
      </li>
    );
  };

  renderAutoCompleteMatches() {
    if (!features.autocompleteExpression) {
      return null;
    }
    const { autocompleteMatches } = this.props;
    if (autocompleteMatches) {
      return (
        <datalist id="autocomplete-matches">
          {autocompleteMatches.map((match, index) => {
            return <option key={index} value={match} />;
          })}
        </datalist>
      );
    }
    return <datalist id="autocomplete-matches" />;
  }

  renderNewExpressionInput() {
    const { expressionError } = this.props;
    const { editing, inputValue, focused } = this.state;
    const error = editing === false && expressionError === true;
    const placeholder = error
      ? L10N.getStr("expressions.errorMsg")
      : L10N.getStr("expressions.placeholder");

    return (
      <li className={classnames("expression-input-container", { focused, error })}>
        <form className="expression-input-form" onSubmit={this.handleNewSubmit}>
          <input
            className="input-expression"
            type="text"
            placeholder={placeholder}
            onChange={this.handleChange}
            onBlur={this.hideInput}
            onKeyDown={this.handleKeyDown}
            onFocus={this.onFocus}
            value={!editing ? inputValue : ""}
            ref={c => (this._input = c)}
            {...(features.autocompleteExpression && {
              list: "autocomplete-matches",
            })}
          />
          {this.renderAutoCompleteMatches()}
          <input type="submit" style={{ display: "none" }} />
        </form>
      </li>
    );
  }

  renderExpressionEditInput(expression) {
    const { expressionError } = this.props;
    const { inputValue, editing, focused } = this.state;
    const error = editing === true && expressionError === true;

    return (
      <span
        className={classnames("expression-input-container", { focused, error })}
        key={expression.input}
      >
        <form
          className="expression-input-form"
          onSubmit={e => this.handleExistingSubmit(e, expression)}
        >
          <input
            className={classnames("input-expression", { error })}
            type="text"
            onChange={this.handleChange}
            onBlur={this.clear}
            onKeyDown={this.handleKeyDown}
            onFocus={this.onFocus}
            value={editing ? inputValue : expression.input}
            ref={c => (this._input = c)}
            {...(features.autocompleteExpression && {
              list: "autocomplete-matches",
            })}
          />
          {this.renderAutoCompleteMatches()}
          <input type="submit" style={{ display: "none" }} />
        </form>
      </span>
    );
  }

  render() {
    const { expressions, showInput } = this.props;

    return (
      <ul className="pane expressions-list">
        {expressions.map(this.renderExpression)}
        {(showInput || !expressions.length) && this.renderNewExpressionInput()}
      </ul>
    );
  }
}

const mapStateToProps = state => ({
  cx: getThreadContext(state),
  autocompleteMatches: getAutocompleteMatchset(state),
  expressions: getExpressions(state),
  expressionError: getExpressionError(state),
});

export default connect(mapStateToProps, {
  autocomplete: actions.autocomplete,
  clearAutocomplete: actions.clearAutocomplete,
  addExpression: actions.addExpression,
  clearExpressionError: actions.clearExpressionError,
  updateExpression: actions.updateExpression,
  deleteExpression: actions.deleteExpression,
  openLink: actions.openLink,
  openElementInInspector: actions.openElementInInspectorCommand,
  highlightDomElement: actions.highlightDomElement,
  unHighlightDomElement: actions.unHighlightDomElement,
})(Expressions);
