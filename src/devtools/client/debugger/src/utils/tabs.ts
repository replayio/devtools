import type { Tab } from "../reducers/tabs";

export function persistTabs(tabs: Tab[]): Tab[] {
  return tabs.filter(tab => tab.url).map(tab => ({ url: tab.url, sourceId: "" }));
}
