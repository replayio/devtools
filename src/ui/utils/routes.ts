import { matchPath, useLocation } from "react-router-dom";

/**
 * Create a library route with the given parameters. Used for replacing
 * legacy routes with their current equivalents.
 */
export function createRouteFromLegacyParams(currentParams: URLSearchParams) {
  const recordingId = currentParams.get("id");
  const path = recordingId ? `/recording/${recordingId}` : "/";
  const newParams = new URLSearchParams();
  currentParams.forEach((value, key) => {
    if (key !== "id") {
      newParams.set(key, value);
    }
  });
  return `${path}?${newParams.toString()}`;
}

export function useGetWorkspaceId(): string | null {
  const { pathname } = useLocation();
  const params: any = matchPath(pathname, { path: "/team/:workspaceId" })?.params;
  return params?.workspaceId || null;
}

export function useGetSettingsTab(): string | null {
  const { pathname } = useLocation();
  const params: any = matchPath(pathname, { path: "/team/:workspaceId/settings/:tab" })?.params;
  return params?.tab || null;
}

export function getWorkspaceRoute(workspaceId: string | null) {
  return workspaceId ? `/team/${workspaceId}` : "/";
}

export function getWorkspaceSettingsRoute(workspaceId: string, tab?: string) {
  return `/team/${workspaceId}/settings/${tab || "Team Members"}`;
}
