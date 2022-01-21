export const prefs: {
  sidebarSize: number;
  splitSidebarSize: number;
  activeTab: string;

  toJSON(): string;
};

export const features: {
  showWhitespaceNodes: boolean;

  toJSON(): string;
};
