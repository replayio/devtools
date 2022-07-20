/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";

import { showMenu, buildMenu } from "devtools/shared/contextmenu";

import SourceIcon from "../shared/SourceIcon";
import { CloseButton } from "../shared/Button";
import { copyToTheClipboard } from "../../utils/clipboard";

import { UIState } from "ui/state";
import { actions } from "ui/actions";

import {
  getFileURL,
  getRawSourceURL,
  getSourceQueryString,
  getTruncatedFileName,
  isPretty,
  shouldBlackbox,
} from "../../utils/source";
import type { Source } from "devtools/client/debugger/src/reducers/sources";
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

interface TabProps {
  source: Source;
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
    toggleBlackBox: actions.toggleBlackBox,
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
      toggleBlackBox,
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
      // TODO Re-enable blackboxing
      /*
      {
        item: {
          ...tabMenuItems.toggleBlackBox,
          label: source.isBlackBoxed ? "Unblackbox source" : "Blackbox source",
          disabled: !shouldBlackbox(source),
          click: () => toggleBlackBox(cx, source),
        },
      },
      */
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
