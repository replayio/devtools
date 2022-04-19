import { TablePropGetter } from "react-table";

import type { Tab } from "../reducers/tabs";

export function getTabMenuItems() {
  return {
    closeAllTabs: {
      accesskey: "a",
      disabled: false,
      id: "node-menu-close-all-tabs",
      label: "Close all tabs",
    },
    closeOtherTabs: {
      accesskey: "o",
      disabled: false,
      id: "node-menu-close-other-tabs",
      label: "Close other tabs",
    },
    closeTab: {
      accesskey: "c",
      disabled: false,
      id: "node-menu-close-tab",
      label: "Close tab",
    },
    closeTabsToEnd: {
      accesskey: "e",
      disabled: false,
      id: "node-menu-close-tabs-to-end",
      label: "Close tabs to the right",
    },
    copySourceUri2: {
      accesskey: "u",
      disabled: false,
      id: "node-menu-copy-source-url",
      label: "Copy source URI",
    },
    copyToClipboard: {
      accesskey: "C",
      disabled: false,
      id: "node-menu-copy-to-clipboard",
      label: "Copy to clipboard",
    },
    prettyPrint: {
      accesskey: "p",
      disabled: false,
      id: "node-menu-pretty-print",
      label: "Pretty print source",
    },
    showSource: {
      accesskey: "r",
      disabled: false,
      id: "node-menu-show-source",
      label: "Reveal in tree",
    },
    toggleBlackBox: {
      accesskey: "B",
      disabled: false,
      id: "node-menu-blackbox",
      label: "Blackbox source",
    },
  };
}

export function isSimilarTab(tab: Tab, url: string, isOriginal?: boolean) {
  return tab.url === url && tab.isOriginal === isOriginal;
}

export function persistTabs(tabs: Tab[]) {
  return [...tabs]
    .filter(tab => tab.url)
    .map(tab => {
      const newTab = { ...tab };
      newTab.sourceId = null;
      return newTab;
    });
}
