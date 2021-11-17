export const prefs: {
  editor: boolean;
  filterDebug: boolean;
  filterError: boolean;
  filterInfo: boolean;
  filterLog: boolean;
  filterNodeModules: boolean;
  filterWarn: boolean;
  inputContext: boolean;
  inputHistoryCount: boolean;
  outlineExpanded: boolean;
  persistLogs: boolean;
  sourcesCollapsed: boolean;
  timestampMessages: boolean;
  timestampsVisible: boolean;
};

export function getPrefsService(): {
  getBoolPref(pref: keyof typeof prefs, deflt: boolean): boolean;
  getIntPref(pref: keyof typeof prefs, deflt: number): number;
  setBoolPref(pref: keyof typeof prefs, value: boolean): void;
  setIntPref(pref: keyof typeof prefs, value: number): void;
  clearUserPref(pref: keyof typeof prefs): void;
};
