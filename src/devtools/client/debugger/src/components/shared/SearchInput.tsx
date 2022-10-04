/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";

import { CloseButton } from "./Button";

import AccessibleImage from "./AccessibleImage";
import classnames from "classnames";

const arrowBtn = (
  onClick: ((e: any) => void) | undefined,
  type: string,
  className: string,
  tooltip: string
) => {
  const props = {
    className,
    key: type,
    onClick,
    title: tooltip,
  };

  return (
    <button {...props}>
      <AccessibleImage className={type} />
    </button>
  );
};

interface SearchInputProps {
  query: string;
  count: number;
  dataTestId?: string;
  placeholder?: string;
  summaryMsg?: string;
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showErrorEmoji?: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onHistoryScroll?: (query: string) => void;
  handleNext?: (e: React.KeyboardEvent) => void;
  handlePrev?: (e: React.KeyboardEvent) => void;
  shouldFocus?: boolean;
  showClose?: boolean;
  hasPrefix?: boolean;
  expanded?: boolean;
  className?: string;
  handleClose?: () => void;
  selectedItemId?: string;
  size: string;
}

class SearchInput extends Component<SearchInputProps> {
  $input: HTMLInputElement | null = null;

  static defaultProps = {
    className: "",
    expanded: false,
    hasPrefix: false,
    selectedItemId: "",
    size: "",
    showClose: true,
  };

  state = {
    history: [] as string[],
  };

  componentDidMount() {
    this.setFocus();
  }

  componentDidUpdate(prevProps: SearchInputProps) {
    if (this.props.shouldFocus && !prevProps.shouldFocus) {
      this.setFocus();
    }
  }

  setFocus() {
    if (this.$input) {
      const input = this.$input;
      input.focus();

      if (!input.value) {
        return;
      }

      // omit prefix @:# from being selected
      const selectStartPos = this.props.hasPrefix ? 1 : 0;
      input.setSelectionRange(selectStartPos, input.value.length + 1);
    }
  }

  renderSvg() {
    return <AccessibleImage className="search" />;
  }

  renderArrowButtons() {
    const { handleNext, handlePrev } = this.props;

    return [
      arrowBtn(handlePrev, "arrow-up", classnames("nav-btn", "prev"), "Previous result"),
      arrowBtn(handleNext, "arrow-down", classnames("nav-btn", "next"), "Next result"),
    ];
  }

  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { onFocus } = this.props;

    if (onFocus) {
      onFocus(e as any);
    }
  };

  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { onBlur } = this.props;

    if (onBlur) {
      onBlur(e as any);
    }
  };

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { onHistoryScroll, onKeyDown } = this.props;
    if (!onHistoryScroll) {
      return onKeyDown(e);
    }

    const inputValue = (e.target as HTMLInputElement).value;
    const { history } = this.state;
    const currentHistoryIndex = history.indexOf(inputValue);

    if (e.key === "Enter") {
      this.saveEnteredTerm(inputValue);
      return onKeyDown(e);
    }

    if (e.key === "ArrowUp") {
      const previous = currentHistoryIndex > -1 ? currentHistoryIndex - 1 : history.length - 1;
      const previousInHistory = history[previous];
      if (previousInHistory) {
        e.preventDefault();
        onHistoryScroll(previousInHistory);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      const next = currentHistoryIndex + 1;
      const nextInHistory = history[next];
      if (nextInHistory) {
        onHistoryScroll(nextInHistory);
      }
    }
  };

  saveEnteredTerm(query: string) {
    const { history } = this.state;
    let newHistory = history.slice();
    const previousIndex = newHistory.indexOf(query);
    if (previousIndex !== -1) {
      newHistory.splice(previousIndex, 1);
    }
    newHistory.push(query);
    this.setState({ history: newHistory });
  }

  renderSummaryMsg() {
    const { summaryMsg } = this.props;

    if (!summaryMsg) {
      return null;
    }

    return <div className="search-field-summary">{summaryMsg}</div>;
  }

  renderSpinner() {
    const { isLoading } = this.props;
    if (isLoading) {
      return <AccessibleImage className="loader spin" />;
    }
  }

  renderNav() {
    const { count, handleNext, handlePrev } = this.props;
    if ((!handleNext && !handlePrev) || !count || count == 1) {
      return;
    }

    return <div className="search-nav-buttons">{this.renderArrowButtons()}</div>;
  }

  render() {
    const {
      className,
      dataTestId,
      expanded,
      handleClose,
      onChange,
      onKeyUp,
      placeholder,
      query,
      selectedItemId,
      showErrorEmoji,
      size,
      showClose,
    } = this.props;

    const inputProps = {};

    return (
      <div className={`search-outline ${className || ""}`}>
        <div
          className={classnames("search-field rounded-lg", size)}
          role="combobox"
          aria-haspopup="listbox"
          aria-owns="result-list"
          aria-expanded={expanded}
        >
          {this.renderSvg()}
          <input
            className={classnames({
              empty: showErrorEmoji,
            })}
            data-test-id={dataTestId}
            onChange={onChange}
            onKeyDown={this.onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            aria-autocomplete={"list" as const}
            aria-controls={"result-list" as const}
            aria-activedescendant={expanded && selectedItemId ? `${selectedItemId}-title` : ""}
            placeholder={placeholder}
            value={query}
            spellCheck={false}
            ref={(c: HTMLInputElement | null) => (this.$input = c)}
          />
          {this.renderSpinner()}
          {this.renderSummaryMsg()}
          {this.renderNav()}
          {showClose && <CloseButton handleClick={handleClose} buttonClass={size} tooltip="" />}
        </div>
      </div>
    );
  }
}

export default SearchInput;
