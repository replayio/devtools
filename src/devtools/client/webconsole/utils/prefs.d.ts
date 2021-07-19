export const prefs: {
  filterError: boolean;
  filterWarn: boolean;
  filterInfo: boolean;
  filterLog: boolean;
  filterDebug: boolean;
  filterNodeModules: boolean;
  persistLogs: boolean;
  inputHistoryCount: boolean;
  editor: boolean;
  timestampMessages: boolean;
  timestampsVisible: boolean;
  inputContext: boolean;
};

export function getPrefsService(): {
  getBoolPref(pref: keyof typeof prefs, deflt: boolean): boolean;
  getIntPref(pref: keyof typeof prefs, deflt: number): number;
  setBoolPref(pref: keyof typeof prefs, value: boolean): void;
  setIntPref(pref: keyof typeof prefs, value: number): void;
  clearUserPref(pref: keyof typeof prefs): void;
};
