import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { parseQueryParams } from "ui/components/Library/Team/utils";

export function useSyncTestRunIdToUrl(
  teamId: string,
  testRunId: string | null,
  setTestRunId: Dispatch<SetStateAction<string | null>>
) {
  const router = useRouter();

  const prevTestRunIdRef = useRef(testRunId);

  // Sync component state changes to URL
  useEffect(() => {
    const prevTestRunId = prevTestRunIdRef.current;
    if (testRunId && testRunId !== prevTestRunId) {
      const pathname = `/team/${teamId}/runs/${testRunId}`;
      if (prevTestRunId === null) {
        router.replace({ pathname, query: router.query });
      } else if (prevTestRunIdRef.current !== testRunId) {
        router.push({ pathname, query: router.query });
      }
    }

    prevTestRunIdRef.current = testRunId;
  }, [router, teamId, testRunId]);

  // Sync URL changes to component state
  useEffect(() => {
    const testRunIdFromState = prevTestRunIdRef.current;
    const { testRunId: testRunIdFromUrl } = parseQueryParams(router.query);
    if (testRunIdFromUrl) {
      if (testRunIdFromState !== testRunIdFromUrl) {
        setTestRunId(testRunIdFromUrl);
      }
    }
  }, [router.query, setTestRunId]);
}
