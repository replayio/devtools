/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React, { PureComponent } from "react";
import { ConnectedProps, connect } from "react-redux";

import { buildMenu, showMenu } from "devtools/shared/contextmenu";
import { actions } from "ui/actions";
import { Redacted } from "ui/components/Redacted";
import { SourceDetails, getHasSiblingOfSameName, getSelectedSource } from "ui/reducers/sources";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import { getActiveSearch, getContext, getSourcesForTabs } from "../../selectors";
import { copyToTheClipboard } from "../../utils/clipboard";
import {
  getFileURL,
  getRawSourceURL,
  getSourceQueryString,
  getTruncatedFileName,
  isPretty,
} from "../../utils/source";
import { getTabMenuItems } from "../../utils/tabs";
import { CloseButton } from "../shared/Button";
import SourceIcon from "../shared/SourceIcon";

interface TabProps {
  source: SourceDetails;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
}

const mapStateToProps = (state: UIState, { source }: TabProps) => {
  const selectedSource = getSelectedSource(state);

  return {
    cx: getContext(state),
    tabSources: getSourcesForTabs(state),
    selectedSource,
    activeSearch: getActiveSearch(state),
    hasSiblingOfSameName: getHasSiblingOfSameName(state, source),
  };
};

const connector = connect(
  mapStateToProps,
  {
    selectSource: actions.selectSource,
    copyToClipboard: actions.copyToClipboard,
    closeTab: actions.closeTab,
    closeTabs: actions.closeTabs,
    showSource: actions.showSource,
    ensureSourcesIsVisible: actions.ensureSourcesIsVisible,
  },
  null,
  {
    forwardRef: true,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
type FinalTabProps = PropsFromRedux & TabProps;

class Tab extends PureComponent<FinalTabProps> {
  onTabContextMenu = (event: React.MouseEvent, tab: string) => {
    event.preventDefault();
    event.stopPropagation();
    this.showContextMenu(event, tab);
  };

  showContextMenu(e: React.MouseEvent, tab: string) {
    const {
      cx,
      closeTab,
      closeTabs,
      copyToClipboard,
      tabSources,
      showSource,
      selectedSource,
      source,
      ensureSourcesIsVisible,
    } = this.props;

    trackEvent("tabs.context_menu");
    const tabCount = tabSources.length;
    const otherTabs = tabSources.filter(t => t.id !== tab);
    const sourceTab = tabSources.find(t => t.id == tab);
    const tabURLs = tabSources.map(t => t.url!);
    const otherTabURLs = otherTabs.map(t => t.url!);

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
          disabled: tabCount === 1 || tabSources.some((t, i) => t.id === tab && tabCount - 1 === i),
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
    ];

    showMenu(e, buildMenu(items));
  }

  isSourceSearchEnabled() {
    // @ts-expect-error activeSearch possible values mismatch
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
    const active = selectedSource && sourceId == selectedSource.id && !this.isSourceSearchEnabled();
    const isPrettyCode = isPretty(source);

    function onClickClose(e: React.MouseEvent) {
      e.stopPropagation();
      trackEvent("tabs.close");
      closeTab(cx, source);
    }

    function handleTabClick(e: React.MouseEvent) {
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
        data-status={active ? "active" : undefined}
        data-test-name={`Source-${getTruncatedFileName(source, query)}`}
        key={sourceId}
        onClick={handleTabClick}
        // Accommodate middle click to close tab
        onMouseUp={e => e.button === 1 && closeTab(cx, source)}
        onContextMenu={e => this.onTabContextMenu(e, sourceId)}
        title={getFileURL(source, false)}
      >
        <SourceIcon
          source={source}
          shouldHide={(icon: string) => ["file", "javascript"].includes(icon)}
        />
        <div className="filename">{getTruncatedFileName(source, query)}</div>
        <CloseButton buttonClass="" handleClick={onClickClose} tooltip={"Close tab"} />
      </Redacted>
    );
  }
}

export default connector(Tab);
