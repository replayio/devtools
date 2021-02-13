/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";

import { connect } from "../../utils/connect";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";

import AccessibleImage from "../shared/AccessibleImage";

import "./EventListeners.css";

const mouseClicks = [
  "event.mouse.auxclick",
  "event.mouse.click",
  "event.mouse.dblclick",
  "event.mouse.mousedown",
  "event.mouse.mouseup",
  "event.mouse.contextmenu",
];

class EventListeners extends Component {
  state = {
    searchText: "",
    focused: false,
    mode: "simple",
  };

  hasMatch(eventOrCategoryName, searchText) {
    const lowercaseEventOrCategoryName = eventOrCategoryName.toLowerCase();
    const lowercaseSearchText = searchText.toLowerCase();

    return lowercaseEventOrCategoryName.includes(lowercaseSearchText);
  }

  getSearchResults() {
    const { searchText } = this.state;
    const { categories } = this.props;
    const searchResults = categories.reduce((results, cat, index) => {
      const category = categories[index];

      if (this.hasMatch(category.name, searchText)) {
        results[category.name] = category.events;
      } else {
        results[category.name] = category.events.filter(event =>
          this.hasMatch(event.name, searchText)
        );
      }

      return results;
    }, {});

    return searchResults;
  }

  onCategoryToggle(category) {
    const {
      expandedCategories,
      removeEventListenerExpanded,
      addEventListenerExpanded,
    } = this.props;

    if (expandedCategories.includes(category)) {
      removeEventListenerExpanded(category);
    } else {
      addEventListenerExpanded(category);
    }
  }

  onCategoryClick(eventIds, isChecked) {
    const { addEventListeners, removeEventListeners } = this.props;

    if (isChecked) {
      addEventListeners(eventIds);
    } else {
      removeEventListeners(eventIds);
    }
  }

  onEventTypeClick(eventId, isChecked) {
    const { addEventListeners, removeEventListeners } = this.props;
    if (isChecked) {
      addEventListeners([eventId]);
    } else {
      removeEventListeners([eventId]);
    }
  }

  onInputChange = event => {
    this.setState({ searchText: event.currentTarget.value });
  };

  onKeyDown = event => {
    if (event.key === "Escape") {
      this.setState({ searchText: "" });
    }
  };

  onFocus = event => {
    this.setState({ focused: true });
  };

  onBlur = event => {
    this.setState({ focused: false });
  };

  renderSearchInput() {
    const { focused, searchText } = this.state;
    const placeholder = "Filter by event type";

    return (
      <form className="event-search-form" onSubmit={e => e.preventDefault()}>
        <input
          className={classnames("event-search-input", { focused })}
          placeholder={placeholder}
          value={searchText}
          onChange={this.onInputChange}
          onKeyDown={this.onKeyDown}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
      </form>
    );
  }

  renderClearSearchButton() {
    const { searchText } = this.state;

    if (!searchText) {
      return null;
    }

    return (
      <button
        onClick={() => this.setState({ searchText: "" })}
        className="devtools-searchinput-clear"
      />
    );
  }

  renderCategoriesList() {
    const { categories } = this.props;

    return (
      <ul className="event-listeners-list">
        {categories.map((category, index) => {
          return (
            <li className="event-listener-group" key={index}>
              {this.renderCategoryHeading(category)}
              {this.renderCategoryListing(category)}
            </li>
          );
        })}
      </ul>
    );
  }

  renderSearchResultsList() {
    const searchResults = this.getSearchResults();
    const searchResultsCount = Object.values(searchResults).flat().length;

    if (searchResultsCount == 0) {
      return (
        <div className="status no-results">{`No search results for "${this.state.searchText}"`}</div>
      );
    }

    return (
      <ul className="event-search-results-list">
        {Object.keys(searchResults).map(category => {
          return searchResults[category].map(event => {
            return this.renderListenerEvent(event, category);
          });
        })}
      </ul>
    );
  }

  renderCategoryHeading(category) {
    const { activeEventListeners, expandedCategories } = this.props;
    const { events } = category;

    const expanded = expandedCategories.includes(category.name);
    const checked = events.every(({ id }) => activeEventListeners.includes(id));
    const indeterminate = !checked && events.some(({ id }) => activeEventListeners.includes(id));

    return (
      <div className="event-listener-header" onClick={() => this.onCategoryToggle(category.name)}>
        <button className="event-listener-expand">
          <AccessibleImage className={classnames("arrow", { expanded })} />
        </button>
        <label className="event-listener-label">
          <span className="event-listener-category">{category.name}</span>
        </label>
      </div>
    );
  }

  renderCategoryListing(category) {
    const { expandedCategories } = this.props;

    const expanded = expandedCategories.includes(category.name);
    if (!expanded) {
      return null;
    }

    return (
      <ul>
        {category.events.map(event => {
          return this.renderListenerEvent(event, category.name);
        })}
      </ul>
    );
  }

  renderCategory(category) {
    return <span className="category-label">{category} ▸ </span>;
  }

  renderListenerEvent(event, category) {
    const { activeEventListeners } = this.props;
    const { searchText } = this.state;

    return (
      <li className="event-listener-event" key={event.id}>
        <label className="event-listener-label">
          <input
            type="checkbox"
            value={event.id}
            onChange={e => this.onEventTypeClick(event.id, e.target.checked)}
            checked={activeEventListeners.includes(event.id)}
          />
          <span className="event-listener-name">
            {searchText ? this.renderCategory(category) : null}
            {event.name}
          </span>
        </label>
      </li>
    );
  }

  renderAdvanced() {
    const { searchText } = this.state;

    return (
      <>
        <div className="event-search-container">{this.renderSearchInput()}</div>
        <div className="event-listeners-content">
          {searchText ? this.renderSearchResultsList() : this.renderCategoriesList()}
        </div>
      </>
    );
  }

  renderSimple() {
    const simpleCategories = ["Mouse", "Keyboard"];

    return (
      <div className="event-listeners-content">
        {simpleCategories.map((category, i) => this.renderSimpleEvent(category, i))}
      </div>
    );
  }

  renderSimpleEvent(categoryName, index) {
    const { categories, activeEventListeners } = this.props;

    const category = categories.find(cat => cat.name == categoryName);
    let eventIds = category.events.map(event => event.id);

    if (categoryName == "Mouse") {
      eventIds = mouseClicks;
    }

    const isAllActive = eventIds.every(event => activeEventListeners.includes(event));
    const indeterminate =
      !isAllActive && eventIds.some(event => activeEventListeners.includes(event));

    return (
      <div className="event-listener-event" key={index}>
        <input
          id={`${categoryName.toLowerCase()}-events`}
          type="checkbox"
          checked={isAllActive}
          onChange={() => this.onCategoryClick(eventIds, !isAllActive)}
          ref={el => el && (el.indeterminate = indeterminate)}
        />
        <label className="event-listener-name" htmlFor={`${categoryName.toLowerCase()}-events`}>
          {categoryName}
        </label>
      </div>
    );
  }

  render() {
    const { mode } = this.state;

    return (
      <div className="event-listeners">
        <div className="event-listeners-modes">
          <button
            className={mode == "simple" ? "selected" : ""}
            onClick={() => this.setState({ mode: "simple" })}
          >
            Simple
          </button>
          <button
            className={mode == "advanced" ? "advanced" : ""}
            onClick={() => this.setState({ mode: "advanced" })}
          >
            Advanced
          </button>
        </div>
        {mode == "simple" ? this.renderSimple() : this.renderAdvanced()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  activeEventListeners: selectors.getActiveEventListeners(state),
  categories: selectors.getEventListenerBreakpointTypes(state),
  expandedCategories: selectors.getEventListenerExpanded(state),
});

export default connect(mapStateToProps, {
  addEventListeners: actions.addEventListenerBreakpoints,
  removeEventListeners: actions.removeEventListenerBreakpoints,
  addEventListenerExpanded: actions.addEventListenerExpanded,
  removeEventListenerExpanded: actions.removeEventListenerExpanded,
})(EventListeners);
