import { usePreference } from "shared/preferences/usePreference";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";

export function useTheme(): "dark" | "light" {
  const [theme] = usePreference("theme");
  if (theme === "system") {
    return getSystemColorScheme();
  } else {
    return theme;
  }
}
