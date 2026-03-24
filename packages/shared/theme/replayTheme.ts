import type { Theme } from "./types";

/** Same key as replay-dashboard `src/lib/theme.ts` — keeps theme in sync when embedded next to the dashboard. */
export const REPLAY_THEME_STORAGE_KEY = "replay_theme";

export const DEFAULT_THEME: Theme = "system";

export function readLocalStorageTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }
  const v = localStorage.getItem(REPLAY_THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") {
    return v;
  }
  return null;
}

export function storeTheme(theme: Theme) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(REPLAY_THEME_STORAGE_KEY, theme);
}

export function getEffectiveTheme(theme: Theme): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return "dark";
}

export function applyThemeToDOM(effectiveTheme: "dark" | "light") {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.setAttribute("data-theme", effectiveTheme);
  // Never assign className — Next/React may set classes on <html> (hydration, fonts, etc.).
  root.classList.remove("theme-light", "theme-dark", "dark");
  root.classList.add(effectiveTheme === "dark" ? "theme-dark" : "theme-light");
  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  }
}

/**
 * Inline in _document to reduce theme flash before React + UserData run.
 * Reads `replay_theme`, then `Replay:UserPreferences.global_theme`, then system.
 */
export const themeInitScript = `(function(){try{var k='${REPLAY_THEME_STORAGE_KEY}';var u='Replay:UserPreferences';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'&&t!=='system'){try{var raw=localStorage.getItem(u);if(raw){var p=JSON.parse(raw);if(p.global_theme==='light'||p.global_theme==='dark'||p.global_theme==='system')t=p.global_theme;}}catch(e){}}if(t!=='light'&&t!=='dark'&&t!=='system')t='system';var eff=t;if(t==='system')eff=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=document.documentElement;r.setAttribute('data-theme',eff);r.classList.remove('theme-light','theme-dark','dark');r.classList.add('theme-'+eff);if(eff==='dark')r.classList.add('dark');}catch(e){}})();`;
