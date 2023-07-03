import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

export function useTheme(): "dark" | "light" {
  const [theme] = useGraphQLUserData("global_theme");
  if (theme === "system") {
    return getSystemColorScheme();
  } else {
    return theme;
  }
}
