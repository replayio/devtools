/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/*
 * Finds the hidden tabs by comparing the tabs' top offset.
 * hidden tabs will have a great top offset.
 *
 * @param sourceTabs Array
 * @param sourceTabEls HTMLCollection
 *
 * @returns Array
 */

export function getLastVisibleTab(sourceTabEls) {
  sourceTabEls = [...sourceTabEls];

  const topOffsets = sourceTabEls.map(el => el.getBoundingClientRect().top);
  const visibleTabsTopOffset = Math.min(...topOffsets);

  const visibleTabs = sourceTabEls.filter(
    el => el.getBoundingClientRect().top < visibleTabsTopOffset + 10
  );

  return visibleTabs.pop();
}

export function getSelectedSourceIsVisible(sourceTabEls) {
  sourceTabEls = [...sourceTabEls];

  const selectedSourceTab = sourceTabEls.find(elem => elem.classList.contains("active"));
  const topOffsets = sourceTabEls.map(el => el.getBoundingClientRect().top);
  const visibleTabsTopOffset = Math.min(...topOffsets);

  return selectedSourceTab?.getBoundingClientRect().top < visibleTabsTopOffset + 10;
}

export function getHiddenTabs(sourceTabs, sourceTabEls) {
  sourceTabEls = [...sourceTabEls];
  function getTopOffset() {
    const topOffsets = sourceTabEls.map(t => t.getBoundingClientRect().top);
    return Math.min(...topOffsets);
  }

  function hasTopOffset(el) {
    // adding 10px helps account for cases where the tab might be offset by
    // styling such as selected tabs which don't have a border.
    const tabTopOffset = getTopOffset();
    return el.getBoundingClientRect().top > tabTopOffset + 10;
  }

  return sourceTabs.filter((tab, index) => {
    const element = sourceTabEls[index];
    return element && hasTopOffset(element);
  });
}

export function getFramework(tabs, url) {
  const tab = tabs.find(t => t?.url === url);

  if (tab) {
    return tab.framework;
  }

  return "";
}

export function getTabMenuItems() {
  return {
    closeTab: {
      id: "node-menu-close-tab",
      label: "Close tab",
      accesskey: "c",
      disabled: false,
    },
    closeOtherTabs: {
      id: "node-menu-close-other-tabs",
      label: "Close other tabs",
      accesskey: "o",
      disabled: false,
    },
    closeTabsToEnd: {
      id: "node-menu-close-tabs-to-end",
      label: "Close tabs to the right",
      accesskey: "e",
      disabled: false,
    },
    closeAllTabs: {
      id: "node-menu-close-all-tabs",
      label: "Close all tabs",
      accesskey: "a",
      disabled: false,
    },
    showSource: {
      id: "node-menu-show-source",
      label: "Reveal in tree",
      accesskey: "r",
      disabled: false,
    },
    copyToClipboard: {
      id: "node-menu-copy-to-clipboard",
      label: "Copy to clipboard",
      accesskey: "C",
      disabled: false,
    },
    copySourceUri2: {
      id: "node-menu-copy-source-url",
      label: "Copy source URI",
      accesskey: "u",
      disabled: false,
    },
    toggleBlackBox: {
      id: "node-menu-blackbox",
      label: "Blackbox source",
      accesskey: "B",
      disabled: false,
    },
    prettyPrint: {
      id: "node-menu-pretty-print",
      label: "Pretty print source",
      accesskey: "p",
      disabled: false,
    },
  };
}

export function isSimilarTab(tab, url, isOriginal) {
  return tab?.url === url && tab.isOriginal === isOriginal;
}

export function persistTabs(tabs) {
  return [...tabs]
    .filter(tab => tab?.url)
    .map(tab => {
      const newTab = { ...tab };
      newTab.sourceId = null;
      return newTab;
    });
}
