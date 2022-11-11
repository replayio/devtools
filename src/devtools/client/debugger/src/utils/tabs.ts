import type { Tab } from "../reducers/tabs";

export function getTabMenuItems() {
  // TODO [FE-926] Review source editor context menu for re-adding later
  // This includes actual implementation (legacy FF menu vs something new),
  // as well as what menu items it should contain.
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
    prettyPrint: {
      id: "node-menu-pretty-print",
      label: "Pretty print source",
      accesskey: "p",
      disabled: false,
    },
  };
}

export function persistTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => tab.url).map(tab => ({ url: tab.url, sourceId: "" }));
}
