import { useContext } from "react";

import {
  EventKind,
  RootCauseAnalysisDataV3,
  Sequence,
} from "shared/root-cause-analysis/RootCauseAnalysisData";

import { Collapsible } from "./Collapsible";
import { ReplayLink } from "./ReplayLink";
import { RootCauseContext } from "./RootCause";

export function NetworkEventSequences({
  sequences,
}: {
  sequences: Sequence<RootCauseAnalysisDataV3.NetworkEventDiscrepancy>[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {sequences.map((d, i) => (
        <NetworkEventSequence group={d} key={i} />
      ))}
    </div>
  );
}
function NetworkEventSequence({
  group,
}: {
  group: Sequence<RootCauseAnalysisDataV3.NetworkEventDiscrepancy>;
}) {
  return (
    <div className="pl-4">
      <Collapsible label={`(${group.kind}) ${group.sequenceId}`}>
        <div className="pl-4">
          <div className="flex flex-col gap-2">
            {group.discrepancies.map((d, i) => (
              <NetworkEventDiscrepancyDisplay key={i} discrepancy={d} />
            ))}
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

function ExtraResponse({
  label,
  value,
  alternateValue,
  point,
  time,
}: {
  label: string;
  value: unknown;
  alternateValue?: unknown;
  point: string;
  time: number;
}) {
  const { failedId } = useContext(RootCauseContext);

  return (
    <Collapsible label={`(Extra+Response) ${label}`}>
      <div className="flex flex-col gap-1 pl-4">
        <div className="flex flex-row gap-4">
          <div>
            <div>Passing value</div>
            <div className="whitespace-pre font-mono">
              {alternateValue
                ? JSON.stringify(alternateValue, null, 2)
                : "No alternate value available"}
            </div>
          </div>
          <div>
            <div>Failing value</div>
            <div className="whitespace-pre font-mono">{JSON.stringify(value, null, 2)}</div>
          </div>
        </div>
        <ReplayLink id={failedId} kind="extra" result="failing" point={point} time={time} />
      </div>
    </Collapsible>
  );
}

function ExtraRequest({ label }: { label: string }) {
  const { failedId } = useContext(RootCauseContext);

  return (
    <Collapsible label={`(Extra+Request) ${label}`}>
      <div className="flex flex-col gap-1 pl-4">
        <ReplayLink id={failedId} kind="extra" result="failing" point={""} time={0} />
      </div>
    </Collapsible>
  );
}

function MissingResponse({
  label,
  path,
  requestTag,
  requestUrl,
  point,
  time,
}: {
  label: string;
  path: string;
  requestTag?: string;
  requestUrl: string;
  point: string;
  time: number;
}) {
  const { successId } = useContext(RootCauseContext);

  return (
    <Collapsible label={`(Missing+Response) ${label}`}>
      <div className="flex flex-col gap-1 pl-4">
        <div className="flex flex-col">
          <div>path: {path}</div>
          {requestTag ? <div>requestTag: {requestTag}</div> : null}
          <div>requestUrl: {requestUrl}</div>
        </div>
        <ReplayLink id={successId} kind="missing" result="passing" point={point} time={time} />
      </div>
    </Collapsible>
  );
}

function MissingRequest({
  label,
  requestMethod,
  requestUrl,
  point,
  time,
}: {
  label: string;
  requestMethod: string;
  requestUrl: string;
  point: string;
  time: number;
}) {
  const { successId } = useContext(RootCauseContext);

  return (
    <Collapsible label={`(Missing+Request) ${label}`}>
      <div className="flex flex-col gap-1 pl-4">
        <div className="flex flex-col">
          <div>requestMethod: {requestMethod}</div>
          <div>requestUrl: {requestUrl}</div>
        </div>
        <ReplayLink id={successId} kind="missing" result="passing" point={point} time={time} />
      </div>
    </Collapsible>
  );
}

function NetworkEventDiscrepancyDisplay({
  discrepancy,
}: {
  discrepancy: RootCauseAnalysisDataV3.NetworkEventDiscrepancy;
}) {
  const {
    kind,
    event: { data, key, point, time },
  } = discrepancy;
  let content;

  if (kind == "Extra") {
    if (data.kind === "ResponseJSON") {
      const { data, alternate } = discrepancy.event as {
        data: RootCauseAnalysisDataV3.NetworkEventContentsResponseJSON;
        alternate?: RootCauseAnalysisDataV3.NetworkEventContentsResponseJSON;
      };

      content = (
        <ExtraResponse
          label={key}
          value={data.value}
          alternateValue={alternate?.value}
          point={point}
          time={time}
        />
      );
    } else if (data.kind === "Request") {
      content = <ExtraRequest label="TODO" />;
    }
  } else {
    if (data.kind === "ResponseJSON") {
      const { path, requestTag, requestUrl } = data;

      content = (
        <MissingResponse
          label={key}
          path={path}
          requestTag={requestTag}
          requestUrl={requestUrl}
          point={point}
          time={time}
        />
      );
    } else if (data.kind === "Request") {
      const { requestMethod, requestUrl } = data;

      content = (
        <MissingRequest
          requestMethod={requestMethod}
          requestUrl={requestUrl}
          label={key}
          point={point}
          time={time}
        />
      );
    }
  }

  return <div>{content}</div>;
}
