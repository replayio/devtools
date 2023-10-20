import React, { useContext, useState } from "react";

import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import type { GetRelatedTests_node_Workspace_relatedTests_edges_node as RelatedTest } from "shared/graphql/generated/GetRelatedTests";
import { TeamContext } from "ui/components/Library/Team/TeamContextRoot";
import { relatedTestsCache } from "ui/components/Library/Team/View/TestRuns/suspense/RelatedTestsCache";
import useToken from "ui/utils/useToken";

import { DashboardLayout, Panel } from "../index";

export function useRelatedTestsSuspends() {
  const graphQLClient = useContext(GraphQLClientContext);
  const { teamId } = useContext(TeamContext);

  const accessToken = useToken();

  return relatedTestsCache.read(graphQLClient, accessToken?.token ?? null, teamId);
}

export const RelatedTestsWithDetail = () => {
  const relatedTests = useRelatedTestsSuspends();
  const [selectedTest, setSelectedTest] = useState<number>(0);

  return (
    <>
      <Panel className="bg-chrome">
        <TestsPanel tests={relatedTests} onSelectTest={setSelectedTest} />
      </Panel>
      <Panel>
        <TestPanel test={relatedTests[selectedTest]} />
      </Panel>
      <Panel>
        <div></div>
      </Panel>
    </>
  );
};

export default function RelatedTestPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-grow flex-row space-x-2">
        <RelatedTestsWithDetail />
      </div>
    </DashboardLayout>
  );
}

function TestsPanel({
  tests,
  onSelectTest,
}: {
  tests: RelatedTest[];
  onSelectTest: (i: number) => void;
}) {
  return (
    <div>
      <h1>Tests</h1>
      <div>
        {tests.map((test, i) => (
          <div key={i} onClick={() => onSelectTest(i)} className="flex gap-2 p-2">
            <h2>{test.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestPanel({ test }: { test: RelatedTest }) {
  const failedTestsRecording = test.tests
    .filter(t => t.result === "failed")
    .flatMap(t => ({ ...t.recording, commitTitle: t.commitTitle }));
  const passedTestsRecording = test.tests
    .filter(t => t.result === "passed")
    .flatMap(t => ({ ...t.recording, commitTitle: t.commitTitle }));
  const unknownTestsRecording = test.tests
    .filter(t => t.result === "unknown")
    .flatMap(t => ({ ...t.recording, commitTitle: t.commitTitle }));

  return (
    <div>
      <div>
        {failedTestsRecording.length !== 0 && (
          <>
            <h2>Recent Failures</h2>
            {failedTestsRecording.map((recording, i) => (
              <a href={`/recording/${recording?.id}`} key={i} className="flex gap-2 p-2">
                <span>{recording?.commitTitle}</span>
                <span>{recording?.createdAt}</span>
              </a>
            ))}
          </>
        )}
        {passedTestsRecording.length !== 0 && (
          <>
            <h2>Recent success</h2>
            {passedTestsRecording.map((recording, i) => (
              <a href={`/recording/${recording?.id}`} key={i} className="flex gap-2 p-2">
                <span>{recording?.commitTitle ?? recording.title}</span>
                <span>{recording?.createdAt}</span>
              </a>
            ))}
          </>
        )}
        {unknownTestsRecording.length !== 0 && (
          <>
            <h2>Recent Unknown</h2>
            {unknownTestsRecording.map((recording, i) => (
              <a href={`/recording/${recording?.id}`} key={i} className="flex gap-2 p-2">
                <span>{recording?.commitTitle}</span>
                <span>{recording?.createdAt}</span>
              </a>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
