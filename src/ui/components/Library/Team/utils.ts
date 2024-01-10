import { ParsedUrlQuery } from "querystring";
import { NextRouter, useRouter } from "next/router";

import { View } from "ui/components/Library/Team/View/ViewContextRoot";
import { getRecordingWorkspace } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

export function parseQueryParams(query: ParsedUrlQuery) {
  const [teamId, view, testRunId] = Array.isArray(query.param) ? query.param : [query.param!];

  return { teamId, testRunId: testRunId || null, view: view as View };
}

export function useGetTeamRouteParams() {
  const { query } = useRouter();

  return parseQueryParams(query);
}

export function useGetTeamIdFromRoute() {
  const { query, route } = useRouter();
  const workspace = useAppSelector(getRecordingWorkspace);

  if (route.startsWith("/team/")) {
    const params = parseQueryParams(query);
    return params.teamId;
  }
  if (workspace) {
    return workspace.id;
  }
  return "me";
}

export function useRedirectToTeam(replace: boolean = false) {
  const router = useRouter();

  return (id: string = "") => {
    if (replace) {
      replaceRoute(router, `/team/${id}`);
    } else {
      pushRoute(router, `/team/${id}`);
    }
  };
}

export function replaceRoute(router: NextRouter, relativeURL: string): void {
  const search = new URL(window.location.origin + router.asPath).search;
  router.replace({
    pathname: relativeURL,
    search,
  });
}

export function pushRoute(router: NextRouter, relativeURL: string): void {
  const search = new URL(window.location.origin + router.asPath).search;
  router.push({
    pathname: relativeURL,
    search,
  });
}
