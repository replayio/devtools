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
import { features, prefs } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import Spinner from "ui/components/shared/Spinner";
import Checkbox from "ui/components/shared/Forms/Checkbox";
import { CountPill } from "devtools/client/webconsole/components/FilterBar/FilterSettings";
import { maxAnalysisPoints } from "ui/constants";

class EventListeners extends Component {
  state = {
    searchText: "",
    focused: false,
    mode: "simple",
  };

  componentDidMount() {
    this.props.loadAdditionalPoints();
  }

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
    const { expandedCategories, removeEventListenerExpanded, addEventListenerExpanded } =
      this.props;

    trackEvent("console.events.category_toggle");

    if (expandedCategories.includes(category)) {
      removeEventListenerExpanded(category);
    } else {
      addEventListenerExpanded(category);
    }
  }

  onCategoryClick(eventIds, isChecked) {
    const { addEventListeners, removeEventListeners } = this.props;

    if (isChecked) {
      trackEvent("console.events.category_select");
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

  onFocus = () => {
    trackEvent("console.events.search");
    this.setState({ focused: true });
  };

  onBlur = () => {
    this.setState({ focused: false });
  };

  renderSearchInput() {
    const { focused, searchText } = this.state;
    const placeholder = "Filter by event type";

    return (
      <form className="event-search-form" onSubmit={e => e.preventDefault()}>
        <input
          className={classnames(
            "event-search-input w-full bg-themeTextField px-2 py-1 text-themeTextFieldColor",
            {
              focused,
            }
          )}
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
      .map(event => eventTypePoints[event.id]?.length || 0)
      .reduce((sum, count) => sum + count, 0);

    if (categoryCount == 0) {
      return null;
    }

    return (
      <li className="event-listener-group space-y-1" key={index}>
        {this.renderCategoryHeadingWithCount(category, categoryCount)}
        <ul className="space-y-1">
          {events.map(event => this.renderListenerEvent(event, category.name))}
        </ul>
      </li>
    );
  }

  renderCategories() {
    const { categories, isLoadingInitialPoints, isLoadingAdditionalPoints } = this.props;

    const commonCategories = categories.filter(category =>
      ["Keyboard", "Mouse"].includes(category.name)
    );

    const otherCategories = categories.filter(
      category => !["Keyboard", "Mouse"].includes(category.name)
    );

    return (
      <div className="flex flex-col space-y-1.5">
        {this.renderCategoriesSection("Common Events", isLoadingInitialPoints, commonCategories)}
        {this.renderCategoriesSection("Other Events", isLoadingAdditionalPoints, otherCategories)}
      </div>
    );
  }

  renderCategoriesSection(label, isLoading, categories) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="">{label}</div>
        <ul className="event-listeners-list space-y-1">
          {isLoading ? (
            <div className="flex h-12 items-center justify-center">
              <Spinner className="h-4 w-4 animate-spin" />
            </div>
          ) : categories.length > 0 ? (
            categories.map((category, index) => this.renderCategoryItem(category, index))
          ) : null}
        </ul>
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
      <ul className="space-y-1">
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
      return <div className="status no-results">{`0 search results`}</div>;
    }

    return (
      <ul className="event-search-results-list space-y-1">
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
      <div
        className="event-listener-header flex w-full flex-row justify-between px-0"
        onClick={() => this.onCategoryToggle(category.name)}
      >
        <div className="event-listener-header-label flex flex-row items-center space-x-2">
          <button className="event-listener-expand pb-px">
            <AccessibleImage className={classnames("arrow", { expanded })} />
          </button>
          <label className="event-listener-label flex-grow">
            <span className="event-listener-category">{category.name}</span>
          </label>
        </div>
        {!expanded ? <CountPill>{count}</CountPill> : null}
      </div>
    );
  }

  renderCategoryHeading(category) {
    const { expandedCategories } = this.props;
    const expanded = expandedCategories.includes(category.name);

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

    const isHot = points.length > prefs.maxHitsEditable || points.length > maxAnalysisPoints;
    const title = isHot ? `Cannot view ${event.name} events` : `View ${event.name} events`;

    return (
      <li
        className="flex flex-row items-center rounded-md pl-2 hover:bg-menuHoverBgcolor"
        key={event.id}
      >
        <div className="flex w-full flex-row justify-between">
          <label title={title} className="flex w-full flex-row items-center space-x-2">
            <Checkbox
              value={event.id}
              disabled={isHot}
              onChange={e => this.onEventTypeClick(event.id, e.target.checked)}
              checked={activeEventListeners.includes(event.id)}
              className="m-0"
            />
            <span className="event-listener-name flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
              {searchText ? this.renderCategory(category) : null}
              {event.name}
            </span>
            <CountPill>{points.length}</CountPill>
          </label>
        </div>
      </li>
    );
  }

  render() {
    const { searchText } = this.state;
    return (
      <div className="event-listeners space-y-2 overflow-y-auto">
        <div className="event-search-container">{this.renderSearchInput()}</div>
        <div className="event-listeners-content">
          {searchText ? this.renderSearchResultsList() : this.renderCategories()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  activeEventListeners: selectors.getActiveEventListeners(state),
  categories: selectors.getEventListenerBreakpointTypes(state),
  expandedCategories: selectors.getEventListenerExpanded(state),
  eventTypePoints: selectors.getEventListenerPoints(state),
  isLoadingInitialPoints: selectors.isLoadingInitialPoints(state),
  isLoadingAdditionalPoints: selectors.isLoadingAdditionalPoints(state),
});

export default connect(mapStateToProps, {
  addEventListeners: actions.addEventListenerBreakpoints,
  removeEventListeners: actions.removeEventListenerBreakpoints,
  addEventListenerExpanded: actions.addEventListenerExpanded,
  removeEventListenerExpanded: actions.removeEventListenerExpanded,
  loadAdditionalPoints: actions.loadAdditionalPoints,
})(EventListeners);
