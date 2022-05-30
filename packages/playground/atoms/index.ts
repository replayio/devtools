import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Position = {
  lineNumber: number;
  columnNumber: number;
};

/**
 * TODO: Using local storage is a super hacky way to communicate between the
 * main window and preview window. This should be moved to use window postMessage.
 */
// https://github.com/pmndrs/jotai/issues/882#issuecomment-990148185
const storage = {
  getItem: (key: string) => {
    const data = JSON.parse(localStorage.getItem(key) || "");
    /** Check if data is a position and return null to prevent highlighting on mount */
    if (data?.startLine) {
      return null;
    }
    return data;
  },

  setItem: (key: string, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  subscribe: (key: string, callback: (value) => void) => {
    const storageEventCallback = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        callback(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", storageEventCallback);
    return () => {
      window.removeEventListener("storage", storageEventCallback);
    };
  },
};

export const playgroundPositionAtom = atomWithStorage("position", null, storage);

export const usePlaygroundPosition = () => useAtom(playgroundPositionAtom);

export const playgroundInstancePositionAtom = atomWithStorage("instancePosition", null, storage);

export const usePlaygroundInstancePosition = () => useAtom(playgroundInstancePositionAtom);

export const playgroundElementsAtom = atomWithStorage("elements", null, storage);

export const usePlaygroundElements = () => useAtom(playgroundElementsAtom);
