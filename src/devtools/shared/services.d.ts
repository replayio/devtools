export const prefs: {
  addObserver: (domain: string, observer: (prefs: any) => void, holdWeak: boolean) => void;
  removeObserver: (domain: string, observer: (prefs: any) => void) => void;
};
export const pref: (key: string, value: any) => void;
