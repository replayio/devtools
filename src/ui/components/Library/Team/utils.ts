import { ParsedUrlQuery } from "querystring";
import { NextRouter, useRouter } from "next/router";

import { View } from "ui/components/Library/Team/View/ViewContextRoot";

export function parseQueryParams(query: ParsedUrlQuery) {
  const [teamId, view, testRunId, _, testId] = Array.isArray(query.param)
    ? query.param
    : [query.param!];

  return { teamId, testRunId: testRunId || null, view: view as View, testId };
}

export function useGetTeamRouteParams() {
  const { query } = useRouter();

  return parseQueryParams(query);
}

export function useGetTeamIdFromRoute() {
  const params = useGetTeamRouteParams();
  return params.teamId;
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
