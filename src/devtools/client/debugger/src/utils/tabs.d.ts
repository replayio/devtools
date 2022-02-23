export interface Tab {
  url: string;
  sourceId: string | null;
}

export function persistTabs(tabs: Tab[]): Tab[];
