import { useRouter } from "next/router";

function parseTeamParams(params: string[]) {
  return { teamId: params[0], view: params[1], focusId: params[2] };
}

export function useGetTeamRouteParams() {
  const { query } = useRouter();
  const params = Array.isArray(query.param) ? query.param : [query.param!];

  return parseTeamParams(params);
}
