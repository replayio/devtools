/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import { connect } from "../../utils/connect";

import { showMenu, buildMenu } from "devtools-contextmenu";

import SourceIcon from "../shared/SourceIcon";
import { CloseButton } from "../shared/Button";
import { copyToTheClipboard } from "../../utils/clipboard";

import { actions } from "ui/actions";

import {
  getFileURL,
  getRawSourceURL,
  getSourceQueryString,
  getTruncatedFileName,
  isPretty,
  shouldBlackbox,
} from "../../utils/source";
import { getTabMenuItems } from "../../utils/tabs";

import {
  getSelectedSource,
  getActiveSearch,
  getSourcesForTabs,
  getHasSiblingOfSameName,
  getContext,
} from "../../selectors";

import classnames from "classnames";
import { trackEvent } from "ui/utils/telemetry";
import { Redacted } from "ui/components/Redacted";

class Tab extends PureComponent {
  onTabContextMenu = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();
    this.showContextMenu(event, tab);
  };

  showContextMenu(e, tab) {
    const {
      cx,
      closeTab,
      closeTabs,
      copyToClipboard,
      tabSources,
      showSource,
      toggleBlackBox,
      selectedSource,
      source,
      ensureSourcesIsVisible,
    } = this.props;

    trackEvent("tabs.context_menu");
    const tabCount = tabSources.length;
    const otherTabs = tabSources.filter(t => t.id !== tab);
    const sourceTab = tabSources.find(t => t.id == tab);
    const tabURLs = tabSources.map(t => t.url);
    const otherTabURLs = otherTabs.map(t => t.url);

    if (!sourceTab || !selectedSource) {
      return;
    }

    const tabMenuItems = getTabMenuItems();
    const items = [
      {
        item: {
          ...tabMenuItems.closeTab,
          click: () => closeTab(cx, sourceTab),
        },
      },
      {
        item: {
          ...tabMenuItems.closeOtherTabs,
          click: () => closeTabs(cx, otherTabURLs),
          disabled: otherTabURLs.length === 0,
        },
      },
      {
        item: {
          ...tabMenuItems.closeTabsToEnd,
          click: () => {
            const tabIndex = tabSources.findIndex(t => t.id == tab);
            closeTabs(
              cx,
              tabURLs.filter((t, i) => i > tabIndex)
            );
          },
          disabled: tabCount === 1 || tabSources.some((t, i) => t === tab && tabCount - 1 === i),
        },
      },
      {
        item: {
          ...tabMenuItems.closeAllTabs,
          click: () => closeTabs(cx, tabURLs),
        },
      },
      { item: { type: "separator" } },
      {
        item: {
          ...tabMenuItems.copyToClipboard,
          disabled: selectedSource.id !== tab,
          click: () => copyToClipboard(sourceTab),
        },
      },
      {
        item: {
          ...tabMenuItems.copySourceUri2,
          disabled: !selectedSource.url,
          click: () => copyToTheClipboard(getRawSourceURL(sourceTab.url)),
        },
      },
      {
        item: {
          ...tabMenuItems.showSource,
          disabled: !selectedSource.url,
          click: () => {
            ensureSourcesIsVisible();
            showSource(cx, tab);
          },
        },
      },
      {
        item: {
          ...tabMenuItems.toggleBlackBox,
          label: source.isBlackBoxed ? "Unblackbox source" : "Blackbox source",
          disabled: !shouldBlackbox(source),
          click: () => toggleBlackBox(cx, source),
        },
      },
    ];

    showMenu(e, buildMenu(items));
  }

  isProjectSearchEnabled() {
    return this.props.activeSearch === "project";
  }

  isSourceSearchEnabled() {
    return this.props.activeSearch === "source";
  }

  render() {
    const {
      cx,
      selectedSource,
      selectSource,
      closeTab,
      source,
      tabSources,
      hasSiblingOfSameName,
      onDragOver,
      onDragStart,
      onDragEnd,
    } = this.props;
    const sourceId = source.id;
    const active =
      selectedSource &&
      sourceId == selectedSource.id &&
      !this.isProjectSearchEnabled() &&
      !this.isSourceSearchEnabled();
    const isPrettyCode = isPretty(source);

    function onClickClose(e) {
      e.stopPropagation();
      trackEvent("tabs.close");
      closeTab(cx, source);
    }

    function handleTabClick(e) {
      e.preventDefault();
      e.stopPropagation();
      trackEvent("tabs.select");
      return selectSource(cx, sourceId);
    }

    const className = classnames("source-tab", {
      active,
      pretty: isPrettyCode,
    });

    const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";

    return (
      <Redacted
        draggable
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={className}
        key={sourceId}
        onClick={handleTabClick}
        // Accommodate middle click to close tab
        onMouseUp={e => e.button === 1 && closeTab(cx, source)}
        onContextMenu={e => this.onTabContextMenu(e, sourceId)}
        title={getFileURL(source, false)}
      >
        <SourceIcon source={source} shouldHide={icon => ["file", "javascript"].includes(icon)} />
        <div className="filename">{getTruncatedFileName(source, query)}</div>
        <CloseButton handleClick={onClickClose} tooltip={"Close tab"} />
      </Redacted>
    );
  }
}

const mapStateToProps = (state, { source }) => {
  const selectedSource = getSelectedSource(state);

  return {
    cx: getContext(state),
    tabSources: getSourcesForTabs(state),
    selectedSource,
    activeSearch: getActiveSearch(state),
    hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
  };
};

export default connect(
  mapStateToProps,
  {
    selectSource: actions.selectSource,
    copyToClipboard: actions.copyToClipboard,
    closeTab: actions.closeTab,
    closeTabs: actions.closeTabs,
    showSource: actions.showSource,
    ensureSourcesIsVisible: actions.ensureSourcesIsVisible,
    toggleBlackBox: actions.toggleBlackBox,
  },
  null,
  {
    withRef: true,
  }
)(Tab);
