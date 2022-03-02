export interface EditorTab {
  url: string;
  sourceId: string | null;
  isOriginal: boolean;
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

export function isSimilarTab(tab: EditorTab, url: string, isOriginal: boolean) {
  return tab.url === url && tab.isOriginal === isOriginal;
}

export function persistTabs(tabs: EditorTab[]) {
  return [...tabs]
    .filter(tab => tab.url)
    .map(tab => {
      const newTab = { ...tab };
      newTab.sourceId = null;
      return newTab;
    });
}
