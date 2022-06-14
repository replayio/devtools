export const prefs: {
  addObserver: (domain: string, observer: (prefs: any) => void, holdWeak: boolean) => void;
  setBoolPref: (domain: string, value: boolean) => void;
  getBoolPref: (domain: string) => boolean;
  setStringPref: (domain: string, value: string) => void;
  getStringPref: (domain: string) => string;
  removeObserver: (domain: string, observer: (prefs: any) => void) => void;
};
export const pref: (key: string, value: any) => void;

export default {
  appinfo: {
    get OS(): "Linux" | "WINNT" | "Darwin" | "Unknown";,
  },
};
