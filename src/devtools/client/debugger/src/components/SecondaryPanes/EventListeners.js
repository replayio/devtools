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
import { features } from "ui/utils/prefs";

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

  renderCategoryItem(category, index) {
    const { eventTypePoints } = this.props;
    const { expandedCategories } = this.props;

    const expanded = expandedCategories.includes(category.name);

    const categoryEvents = category.events || [];
    const events = expanded
      ? categoryEvents.filter(event => eventTypePoints[event.id]?.length > 0)
      : [];

    const categoryCount = categoryEvents
      .map(event => eventTypePoints[event.id].length)
      .reduce((sum, count) => sum + count, 0);

    if (categoryCount == 0) {
      return null;
    }

    return (
      <li className="event-listener-group" key={index}>
        {this.renderCategoryHeadingWithCount(category, categoryCount)}
        <ul>{events.map(event => this.renderListenerEvent(event, category.name))}</ul>
      </li>
    );
  }

  renderCategories() {
    const { categories } = this.props;

    const commonCategories = categories.filter(category =>
      ["Keyboard", "Mouse"].includes(category.name)
    );
    const otherCategories = categories.filter(
      category => !["Keyboard", "Mouse"].includes(category.name)
    );

    return (
      <div className="flex flex-col space-y-1.5">
        {commonCategories.length
          ? this.renderCategoriesSection("Common Events", commonCategories)
          : null}
        {this.renderCategoriesSection("Other Events", otherCategories)}
      </div>
    );
  }

  renderCategoriesSection(label, categories) {
    let content;

    if (!features.eventCount) {
      content = categories.map((category, index) => {
        return (
          <li className="event-listener-group" key={index}>
            {this.renderCategoryHeading(category)}
            {this.renderCategoryListing(category)}
          </li>
        );
      });
    } else {
      content = categories.map((category, index) => this.renderCategoryItem(category, index));
    }

    return (
      <div className="flex flex-col space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <ul className="event-listeners-list">{content}</ul>
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

  renderCategoryHeadingWithCount(category, count) {
    const { expandedCategories } = this.props;

    const expanded = expandedCategories.includes(category.name);

    return (
      <div className="event-listener-header" onClick={() => this.onCategoryToggle(category.name)}>
        <div className="event-listener-header-label">
          <button className="event-listener-expand">
            <AccessibleImage className={classnames("arrow", { expanded })} />
          </button>
          <label className="event-listener-label">
            <span className="event-listener-category">{category.name}</span>
          </label>
        </div>
        <div>{count}</div>
      </div>
    );
  }

  renderCategoryHeading(category) {
    const { activeEventListeners, expandedCategories } = this.props;
    const { events } = category;

    const expanded = expandedCategories.includes(category.name);
    const checked = events.every(({ id }) => activeEventListeners.includes(id));

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

  renderCategory(category) {
    return <span className="category-label">{category} ▸ </span>;
  }

  renderListenerEvent(event, category) {
    const { activeEventListeners, eventTypePoints } = this.props;
    const { searchText } = this.state;

    const points = eventTypePoints[event.id];
    if (features.eventCount && (!points || points.length == 0)) {
      return null;
    }

    return (
      <li
        className="px-2 pl-5 mr-1 rounded-sm flex flex-row items-center hover:bg-gray-200"
        key={event.id}
      >
        <div className="flex flex-row justify-between w-full">
          <label className="w-full flex flex-row items-center">
            <input
              type="checkbox"
              value={event.id}
              onChange={e => this.onEventTypeClick(event.id, e.target.checked)}
              checked={activeEventListeners.includes(event.id)}
              className="focus:primaryAccentHover h-4 w-4 text-primaryAccent border-gray-300 rounded flex-shrink-0"
            />
            <span className="event-listener-name flex-grow">
              {searchText ? this.renderCategory(category) : null}
              {event.name}
            </span>
            {features.eventCount ? (
              <span className="event-listener-count flex-shrink-0">{points.length}</span>
            ) : null}
          </label>
        </div>
      </li>
    );
  }

  renderAdvanced() {
    const { searchText } = this.state;

    return (
      <>
        <div className="event-search-container">{this.renderSearchInput()}</div>
        <div className="event-listeners-content">
          {searchText ? this.renderSearchResultsList() : this.renderCategories()}
        </div>
      </>
    );
  }

  render() {
    return <div className="event-listeners">{this.renderAdvanced()}</div>;
  }
}

const mapStateToProps = state => ({
  activeEventListeners: selectors.getActiveEventListeners(state),
  categories: selectors.getEventListenerBreakpointTypes(state),
  expandedCategories: selectors.getEventListenerExpanded(state),
  eventTypePoints: selectors.getEventListenerPoints(state),
});

export default connect(mapStateToProps, {
  addEventListeners: actions.addEventListenerBreakpoints,
  removeEventListeners: actions.removeEventListenerBreakpoints,
  addEventListenerExpanded: actions.addEventListenerExpanded,
  removeEventListenerExpanded: actions.removeEventListenerExpanded,
})(EventListeners);
