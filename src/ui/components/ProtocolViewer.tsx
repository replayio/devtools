import { Tab as HeadlessTab } from "@headlessui/react";
import { FunctionMatch, Location, Value as ProtocolValue } from "@replayio/protocol";
import dynamic from "next/dynamic";
import React, {
  MutableRefObject,
  ReactNode,
  Suspense,
  useContext,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Tab } from "devtools/client/shared/components/ResponsiveTabs";
import { CommandResponse } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import Loader from "replay-next/components/Loader";
import { AnalysisResult, runAnalysisAsync } from "replay-next/src/suspense/AnalysisCache";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { getHitPointsForLocationAsync } from "replay-next/src/suspense/ExecutionPointsCache";
import { getBreakpointPositionsAsync } from "replay-next/src/suspense/SourcesCache";
import { ReplayClient } from "shared/client/ReplayClient";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserInfo } from "ui/hooks/users";
import { getTheme } from "ui/reducers/app";
import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
  Recorded,
  RequestSummary,
  getProtocolErrorMap,
  getProtocolRequestMap,
  getProtocolResponseMap,
} from "ui/reducers/protocolMessages";
import { SourceDetails, getAllSourceDetails } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getSymbolsAsync } from "ui/suspense/sourceCaches";
import { getJSON } from "ui/utils/objectFetching";
import { formatDuration, formatTimestamp } from "ui/utils/time";

import { PrimarySmButton } from "./shared/Button";
import styles from "./ProtocolViewer.module.css";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

const MAX_DETAILS_TO_RENDER = 10;
const REQUEST_DURATION_MEDIUM_THRESHOLD_MS = 250;
const REQUEST_DURATION_SLOW_THRESHOLD_MS = 1000;
const ADMIN_APP_BASE_URL = "http://admin.replay.prod/controllers";
const BACKEND_GITHUB_REPO_BASE_URL = "https://github.com/recordReplay/backend/";

type RequestSummaryChunk = {
  class: string;
  errored: boolean;
  ids: number[];
  count: number;
  method: string;
  pending: boolean;
  startedAt: number;
};

// Collapses consecutive requests with the same method name and shows the count.
const flattenRequests = (requestMap: { [key: number]: RequestSummary }): RequestSummaryChunk[] => {
  const flattened: RequestSummaryChunk[] = [];
  let current: RequestSummaryChunk | null = null;

  for (let id in requestMap) {
    const request = requestMap[id];

    if (current == null || current.class !== request.class || current.method !== request.method) {
      current = {
        class: request.class,
        count: 1,
        errored: request.errored,
        ids: [request.id],
        method: request.method,
        pending: request.pending,
        startedAt: request.recordedAt,
      };

      flattened.push(current);
    } else {
      current.count++;
      current.errored ||= request.errored;
      current.pending ||= request.pending;
      current.ids.push(request.id);
    }
  }

  return flattened;
};

function JSONViewer({ src }: { src: object }) {
  const theme = useAppSelector(getTheme);

  return (
    <ReactJson
      displayDataTypes={false}
      displayObjectSize={false}
      shouldCollapse={false}
      src={src}
      style={{ backgroundColor: "transparent" }}
      theme={theme == "light" ? "rjv-default" : "tube"}
    />
  );
}

function ProtocolRequestDetailPanel({
  autoExpand,
  children,
  header,
}: {
  autoExpand: boolean;
  children: ReactNode;
  header: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  return (
    <>
      <h3 className={styles.AccordionHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <MaterialIcon iconSize="2xl">{isExpanded ? "arrow_drop_down" : "arrow_right"}</MaterialIcon>
        {header}
      </h3>
      {isExpanded && children}
    </>
  );
}

function ProtocolRequestDetail({
  error,
  index,
  request,
  response,
}: {
  error: (CommandResponse & Recorded) | undefined;
  index: number;
  request: RequestSummary;
  response: (CommandResponse & Recorded) | undefined;
}) {
  const { internal: isInternalUser } = useGetUserInfo();
  const recordingId = useGetRecordingId();

  let className = "";
  if (error != null) {
    className = styles.ColorErrored;
  } else if (response == null) {
    className = styles.ColorPending;
  }

  let reportBugLink = null;
  // If this command failed, or is hung, we might want to report it to the backend team.
  if (isInternalUser) {
    if (error != null || response == null) {
      const title = `${request.method} failure`;
      const body = [
        `Recording ID: ${recordingId}`,
        `Session ID: ${ThreadFront.sessionId}`,
        `Command ID: ${request.id}`,
      ].join("\n");

      reportBugLink = `${BACKEND_GITHUB_REPO_BASE_URL}/issues/new?body=${encodeURIComponent(
        body
      )}&title=${encodeURIComponent(title)}&labels=bug,bug-report`;
    }
  }

  return (
    <ProtocolRequestDetailPanel
      autoExpand={index === 0}
      header={
        <>
          <span className={styles.DetailPanelHeaderPrimary}>
            <span className={className}>{request.method}</span>
            {reportBugLink != null && (
              <a
                className={styles.BugReportLink}
                href={reportBugLink}
                rel="noreferrer noopener"
                target="_blank"
                title="Report protocol bug"
              >
                <MaterialIcon>bug_report</MaterialIcon>
              </a>
            )}
          </span>
          <small className={styles.DetailPanelHeaderSecondary}>
            {response ? `(${formatDuration(response.recordedAt - request.recordedAt)}) ` : ""}
            {formatTimestamp(request.recordedAt)}
          </small>
        </>
      }
    >
      <div className={styles.DetailPanel}>
        <h3 className={styles.DetailPanelHeader}>Request</h3>
        <div className={styles.JSONViewerContainer}>
          <JSONViewer src={request} />
        </div>
        {response != null && (
          <>
            <h3 className={styles.DetailPanelHeader}>Response</h3>
            <div className={styles.JSONViewerContainer}>
              <JSONViewer src={response} />
            </div>
          </>
        )}
        {error != null && (
          <>
            <h3 className={styles.DetailPanelHeader}>Error</h3>
            <div className={styles.JSONViewerContainer}>
              <JSONViewer src={error} />
            </div>
          </>
        )}
      </div>
    </ProtocolRequestDetailPanel>
  );
}

interface ProtocolViewerProps {
  errorMap: ProtocolErrorMap;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
}

export function ProtocolViewer({ errorMap, requestMap, responseMap }: ProtocolViewerProps) {
  const [clearBeforeIndex, setClearBeforeIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const deferredFilterText = useDeferredValue(filterText);

  const [selectedChunk, setSelectedChunk] = useState<RequestSummaryChunk | null>(null);

  const chunks = useMemo(() => flattenRequests(requestMap), [requestMap]);
  const filteredChunks = useMemo(
    () =>
      chunks.slice(clearBeforeIndex).filter(chunk => {
        const fullString = `${chunk.class}.${chunk.method}`.toLowerCase();
        return fullString.includes(deferredFilterText.toLowerCase());
      }),
    [chunks, clearBeforeIndex, deferredFilterText]
  );
  const doesFilteredChunksContainSelectedChunk = useMemo(
    () => selectedChunk !== null && filteredChunks.includes(selectedChunk),
    [filteredChunks, selectedChunk]
  );

  const onFilterTextInputChange = (event: React.ChangeEvent) => {
    setFilterText((event.currentTarget as HTMLInputElement).value);
  };

  const onClearButtonClick = () => {
    setClearBeforeIndex(chunks.length);
  };

  const { internal: isInternalUser } = useGetUserInfo();

  let viewLogLink = null;
  if (isInternalUser) {
    const sessionId = ThreadFront.sessionId;
    const sessionIdPieces = sessionId?.split("/");
    if (sessionIdPieces?.length === 2) {
      const controllerId = sessionIdPieces[0];

      viewLogLink = `${ADMIN_APP_BASE_URL}/${controllerId}`;
    }
  }

  return (
    <div className={styles.Container}>
      <h3 className={styles.Header}>
        Protocol Info
        {viewLogLink != null && (
          <a href={viewLogLink} rel="noreferrer noopener" target="_blank" title="View session logs">
            <MaterialIcon>launch</MaterialIcon>
          </a>
        )}
      </h3>

      <div className={styles.HeaderControls}>
        <input
          className={styles.FilterInput}
          placeholder="Filter"
          value={filterText}
          onChange={onFilterTextInputChange}
        />

        <button
          className={styles.ClearButton}
          disabled={filteredChunks.length === 0}
          title="Clear protocol log"
          onClick={onClearButtonClick}
        >
          <Icon
            filename="trash"
            className={filteredChunks.length === 0 ? styles.ClearIconDisabled : styles.ClearIcon}
          />
        </button>
      </div>

      <div className={styles.Panel}>
        {filteredChunks.map(chunk => (
          <ProtocolChunkMemo
            key={chunk.ids[0]}
            chunk={chunk}
            responseMap={responseMap}
            requestMap={requestMap}
            selectedChunk={selectedChunk}
            setSelectedChunk={setSelectedChunk}
          />
        ))}
      </div>
      {selectedChunk !== null && doesFilteredChunksContainSelectedChunk && (
        <SelectedRequestDetails
          key={selectedChunk.ids[0]}
          errorMap={errorMap}
          requestMap={requestMap}
          responseMap={responseMap}
          selectedChunk={selectedChunk}
        />
      )}
    </div>
  );
}

function SelectedRequestDetails({
  errorMap,
  requestMap,
  responseMap,
  selectedChunk,
}: {
  errorMap: { [id: number]: CommandResponse & Recorded };
  requestMap: { [id: number]: RequestSummary };
  responseMap: { [id: number]: CommandResponse & Recorded };
  selectedChunk: RequestSummaryChunk | null;
}) {
  const [loadAll, setLoadAll] = useState(false);

  if (selectedChunk === null) {
    return null;
  }

  const ids = loadAll ? selectedChunk.ids : selectedChunk.ids.slice(0, MAX_DETAILS_TO_RENDER);
  const hiddenCount = loadAll ? 0 : Math.max(0, selectedChunk.ids.length - MAX_DETAILS_TO_RENDER);

  return (
    <div className={styles.Details}>
      {ids.map((id, index) => {
        const error = errorMap[id];
        const request = requestMap[id];
        const response = responseMap[id];

        return (
          <ProtocolRequestDetail
            key={request!.id}
            index={index}
            request={request!}
            response={response}
            error={error}
          />
        );
      })}
      {hiddenCount > 0 && (
        <div className={styles.LoadRemainingDetails}>
          <PrimarySmButton color="blue" onClick={() => setLoadAll(true)}>
            Load additional {hiddenCount} requests...
          </PrimarySmButton>
        </div>
      )}
    </div>
  );
}

function ProtocolChunk({
  chunk,
  responseMap,
  requestMap,
  selectedChunk,
  setSelectedChunk,
}: {
  chunk: RequestSummaryChunk;
  responseMap: { [key: number]: CommandResponse & Recorded };
  requestMap: { [key: number]: RequestSummary };
  selectedChunk: RequestSummaryChunk | null;
  setSelectedChunk: React.Dispatch<React.SetStateAction<RequestSummaryChunk | null>>;
}) {
  const isSelected = selectedChunk === chunk;
  const prevIsSelectedRef = useRef<boolean>(false);

  const ref = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  // Make sure the selected request is still visible after details panel opens.
  useLayoutEffect(() => {
    if (isSelected && prevIsSelectedRef.current !== isSelected) {
      const div = ref.current;
      if (div) {
        div.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    }

    prevIsSelectedRef.current = isSelected;
  }, [isSelected]);

  let className = styles.Chunk;
  if (isSelected) {
    className = styles.ChunkSelected;
  } else if (chunk.errored) {
    className = styles.ChunkErrored;
  } else if (chunk.pending) {
    className = styles.ChunkPending;
  }

  const chunksLength = chunk.ids.length;

  const durations = chunk.ids.reduce((total, id) => {
    const request = requestMap[id];
    const response = responseMap[id];
    if (request && response) {
      total += response.recordedAt - request.recordedAt;
    }
    return total;
  }, 0);
  const averageDuration = Math.round(durations / chunksLength);

  const selectChunk = () => setSelectedChunk(chunk);

  let durationName = styles.ChunkDurationFast;
  if (averageDuration > REQUEST_DURATION_SLOW_THRESHOLD_MS) {
    durationName = styles.ChunkDurationSlow;
  } else if (averageDuration > REQUEST_DURATION_MEDIUM_THRESHOLD_MS) {
    durationName = styles.ChunkDurationMedium;
  }

  const durationTitle =
    chunksLength > 1 ? `${averageDuration}ms average` : `${Math.round(durations)}ms`;

  return (
    <div ref={ref} className={className} onClick={selectChunk}>
      <div className={styles.ChunkStartTime}>{formatTimestamp(chunk.startedAt)}</div>
      <div className={styles.ChunkCount}>
        {chunk.count > 1 ? <div className={styles.ChunkCountBadge}>{chunk.count}</div> : null}
      </div>
      <div className={styles.ChunkMethod} title={`${chunk.class}.${chunk.method}`}>
        {chunk.method}
      </div>
      <div className={styles.ChunkDuration}>
        {durations > 0 ? (
          <div className={durationName} title={durationTitle}>
            {formatDuration(averageDuration)}
          </div>
        ) : (
          <MaterialIcon>pending</MaterialIcon>
        )}
      </div>
    </div>
  );
}

const ProtocolChunkMemo = React.memo(ProtocolChunk);

export function LiveAppProtocolViewer() {
  const requestMap = useAppSelector(getProtocolRequestMap);
  const responseMap = useAppSelector(getProtocolResponseMap);
  const errorMap = useAppSelector(getProtocolErrorMap);

  return <ProtocolViewer errorMap={errorMap} requestMap={requestMap} responseMap={responseMap} />;
}

interface AllProtocolMessages {
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
  errorMap: ProtocolErrorMap;
}

const NO_PROTOCOL_MESSAGES: AllProtocolMessages = {
  requestMap: {},
  responseMap: {},
  errorMap: {},
};

interface ProtocolMessageCommon {
  id: number;
  recordedAt: number;
}

const { getValueSuspense: getRecordedProtocolMessagesSuspense } = createGenericCache<
  [replayClient: ReplayClientInterface],
  [sourceDetails: SourceDetails[]],
  AllProtocolMessages
>(
  "recordedPotocolMessagesCache",
  1,
  async (replayClient, sourceDetails) => {
    const sessionSource = sourceDetails.find(source => source.url?.includes("ui/actions/session"));

    if (!sessionSource) {
      return NO_PROTOCOL_MESSAGES;
    }

    const [breakablePositionsSorted] = await getBreakpointPositionsAsync(
      replayClient,
      sessionSource.id
    );
    const symbols = await getSymbolsAsync(replayClient, sessionSource.id);

    const mapNamesToCallbackNames: Record<keyof AllProtocolMessages, string> = {
      requestMap: "onRequest",
      responseMap: "onResponse",
      errorMap: "onResponseError",
    };

    const results = { ...NO_PROTOCOL_MESSAGES };

    const promises = Object.entries(mapNamesToCallbackNames).map(
      async ([fieldName, functionName]) => {
        // Start by finding the parsed listing for this function
        const functionEntry = symbols?.functions.find(entry => entry.name === functionName);

        if (!functionEntry) {
          return;
        }

        const { start, end } = functionEntry.location;

        // There should be a breakable position starting on the next line
        const firstBreakablePosition = breakablePositionsSorted.find(
          bp => bp.line > start.line && bp.line < end.line
        );

        if (!firstBreakablePosition) {
          return;
        }
        const position: Location = {
          sourceId: sessionSource.id,
          line: firstBreakablePosition.line,
          column: firstBreakablePosition.columns[0],
        };

        // Get all the times that first line was hit
        const [hitPoints] = await getHitPointsForLocationAsync(replayClient, position, null, null);

        // For every hit, grab the first arg, which should be the `event`
        // that is either the request, response, or error data
        const getAnalysisResults = await runAnalysisAsync(
          replayClient,
          null,
          position,
          "[...arguments][0]",
          null
        );

        // `getAnalysisResults` is a lookup function, so convert the
        // hit execution points to the actual results
        const hitPointsWithResults = hitPoints
          .map(hp => {
            return getAnalysisResults(hp);
          })
          .filter(b => !!b) as AnalysisResult[];

        // For every analysis result, download the entire event object
        // as a real JS object, and add the relevant timestamp
        const events = await Promise.all(
          hitPointsWithResults.map(async analysisResult => {
            const values: ProtocolValue[] = analysisResult.values;
            const [eventValue] = values;

            // @ts-ignore
            let parsedObject: ProtocolMessageCommon = {};

            if (eventValue?.object) {
              parsedObject = (await getJSON(
                replayClient,
                analysisResult.pauseId!,
                eventValue
              )) as unknown as ProtocolMessageCommon;
            }

            parsedObject.recordedAt = analysisResult.time;

            return parsedObject;
          })
        );

        const eventsById: Record<string, ProtocolMessageCommon> = {};

        // The `<ProtocolViewer>` wants these normalized by ID
        events.forEach(event => {
          eventsById[event.id] = event;
        });

        // @ts-ignore it wants specific field names, not `string`
        results[fieldName] = eventsById;
      }
    );

    await Promise.all(promises);

    return results;
  },
  () => "alwaysCacheThis"
);

function RecordedProtocolMessages({ sourceDetails }: { sourceDetails: SourceDetails[] }) {
  const replayClient = useContext(ReplayClientContext);

  const allProtocolMessages = getRecordedProtocolMessagesSuspense(replayClient, sourceDetails);

  return <ProtocolViewer {...allProtocolMessages} />;
}

export function RecordedAppProtocolViewer() {
  const sourceDetails = useAppSelector(getAllSourceDetails);

  const isRecordingOfReplay = useMemo(() => {
    const hasKnownReplaySources = sourceDetails.some(source => {
      return (
        source.url?.includes("src/ui/setup/store.ts") ||
        source.url?.includes("src/ui/setup/dynamic/devtools.ts")
      );
    });

    return hasKnownReplaySources;
  }, [sourceDetails]);

  let content: React.ReactNode;

  if (sourceDetails.length === 0) {
    content = <i>Loading sources...</i>;
  } else if (!isRecordingOfReplay) {
    content = <span className="text-base">Not a recording of Replay</span>;
  } else {
    content = (
      <Suspense fallback={<Loader />}>
        <RecordedProtocolMessages sourceDetails={sourceDetails} />
      </Suspense>
    );
  }

  return <div>{content}</div>;
}

type ProtocolViewerTabs = "live" | "recorded";
interface ProtocolTab {
  id: ProtocolViewerTabs;
  text: string;
}
const tabs: readonly ProtocolTab[] = [
  { id: "live", text: "Live" },
  { id: "recorded", text: "Recorded" },
];

export function ProtocolViewerPanel() {
  return (
    <div className="flex h-full flex-col">
      <HeadlessTab.Group>
        <div className="tabs shrink">
          <HeadlessTab.List
            className="tabs-navigation"
            style={{
              borderBottom: "1px solid var(--theme-splitter-color)",
            }}
          >
            {tabs.map(tab => (
              <HeadlessTab key={tab.id}>
                {({ selected }) => {
                  return <Tab id={tab.id} text={tab.text} active={selected} />;
                }}
              </HeadlessTab>
            ))}
          </HeadlessTab.List>
        </div>
        <HeadlessTab.Panels className="h-full grow">
          <HeadlessTab.Panel as={LiveAppProtocolViewer} />
          <HeadlessTab.Panel as={RecordedAppProtocolViewer} />
        </HeadlessTab.Panels>
      </HeadlessTab.Group>
    </div>
  );
}

export default ProtocolViewerPanel;
