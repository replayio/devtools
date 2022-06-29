import { useRouter } from "next/router";
import { View } from "ui/components/Library/Team/View/ViewContext";

function parseTeamParams(params: string[]) {
  return { teamId: params[0] as string, view: params[1] as View, focusId: params[2] as string };
}

export function useGetTeamRouteParams() {
  const { query } = useRouter();
  const params = Array.isArray(query.param) ? query.param : [query.param!];

  return parseTeamParams(params);
}
