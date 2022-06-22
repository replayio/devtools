import { useLayoutEffect, useState } from "react";
import { localStorageGetItem } from "../utils/storage";

type Theme = "light" | "dark";

export default function useSystemTheme() {
  const [theme, setTheme] = useState(() => getSystemTheme());

  useLayoutEffect(() => {
    const onChange = () => {
      setTheme(getSystemTheme());
    };

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onChange);
    return () => {
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", onChange);
    };
  }, []);

  return theme;
}

function getSystemTheme(): Theme | null {
  if (window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    } else {
      return "light";
    }
  } else {
    return null;
  }
}
