import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { parseQueryParams } from "ui/components/Library/Team/utils";

export function useSyncTestIdToUrl(
  teamId: string,
  testId: string | null,
  setTestId: Dispatch<SetStateAction<string | null>>
) {
  const router = useRouter();

  const prevTestIdRef = useRef(testId);

  // Sync component state changes to URL
  useEffect(() => {
    const prevTestId = prevTestIdRef.current;
    if (testId && testId !== prevTestId) {
      const pathname = `/team/${teamId}/tests/${testId}`;
      if (prevTestId === null) {
        router.replace({ pathname, query: router.query });
      } else if (prevTestIdRef.current !== testId) {
        router.push({ pathname, query: router.query });
      }
    }

    prevTestIdRef.current = testId;
  }, [router, teamId, testId]);

  // Sync URL changes to component state
  useEffect(() => {
    const testIdFromState = prevTestIdRef.current;
    const { testId: testIdFromUrl } = parseQueryParams(router.query);
    if (testIdFromUrl) {
      if (testIdFromState !== testIdFromUrl) {
        setTestId(testIdFromUrl);
      }
    }
  }, [router.query, setTestId]);
}
