import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function parseTeamParams(params: string[]) {
  return { teamId: params[0], view: params[1], focusId: params[2] };
}

export function useGetTeamRouteParams() {
  const { query } = useRouter();
  const params = Array.isArray(query.param) ? query.param : [query.param!];

  console.log({ query });

  return parseTeamParams(params);
}

const generateEmptyArray = (count: number) => new Array(count).fill("").map((_, i) => i);

export function useSimulateListQuery(id: string, count: number = 50, timeout: number = 1000) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    console.log("false");
  }, [id]);

  useEffect(() => {
    if (!loaded) {
      setTimeout(() => setLoaded(true), timeout);
    }
  }, [loaded, timeout]);

  return loaded
    ? { results: generateEmptyArray(count), loading: false }
    : { results: null, loading: true };
}
