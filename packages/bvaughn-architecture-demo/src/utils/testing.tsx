import { RenderResult, act, render as rtlRender } from "@testing-library/react";
import fetch from "isomorphic-fetch";
import { ReactNode } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import {
  ConsoleFiltersContext,
  ConsoleFiltersContextRoot,
  ConsoleFiltersContextType,
} from "../contexts/ConsoleFiltersContext";
import { FocusContext, FocusContextType } from "../contexts/FocusContext";
import { PointsContext, PointsContextType } from "../contexts/PointsContext";
import { SessionContext, SessionContextType } from "../contexts/SessionContext";
import { TimelineContext, TimelineContextType } from "../contexts/TimelineContext";

// This particular method is written to enable testing the entire client.
// The only context values it stubs out are the ReplayClient (ReplayClientContext).
export async function render(
  children: ReactNode,
  options?: {
    replayClient?: Partial<ReplayClientInterface>;
    sessionContext?: Partial<SessionContextType>;
  }
): Promise<{
  renderResult: RenderResult;
  replayClient: ReplayClientInterface;
  sessionContext: SessionContextType;
}> {
  const replayClient: ReplayClientInterface = {
    ...createMockReplayClient(),
    ...options?.replayClient,
  };

  const sessionContext: SessionContextType = {
    accessToken: null,
    currentUserInfo: null,
    duration: 1000,
    recordingId: "fakeRecordingId",
    sessionId: "fakeSessionId",
    refetchUser: () => {},
    trackEvent: () => {},
    ...options?.sessionContext,
  };

  let renderResult: RenderResult = null as any;
  await act(async () => {
    const result = rtlRender(
      <ReplayClientContext.Provider value={replayClient}>
        <SessionContext.Provider value={sessionContext}>
          <ConsoleFiltersContextRoot>{children}</ConsoleFiltersContextRoot>
        </SessionContext.Provider>
      </ReplayClientContext.Provider>
    );

    renderResult = result;
  });

  return {
    renderResult,
    replayClient,
    sessionContext,
  };
}

// We could render the entire app and let it inject the "real" contexts,
// or we can render our own contexts to control the values being shown (and what we're testing).
// The only thing we NEED to override in all cases is the ReplayClient (ReplayClientContext).
//
// This particular method is written to enable focused component testing.
// In other words, it stubs out all of the contexts any component in the app may need.
export async function renderFocused(
  children: ReactNode,
  options?: {
    consoleFiltersContext?: Partial<ConsoleFiltersContextType>;
    focusContext?: Partial<FocusContextType>;
    timelineContext?: Partial<TimelineContextType>;
    pointsContext?: Partial<PointsContextType>;
    replayClient?: Partial<ReplayClientInterface>;
    sessionContext?: Partial<SessionContextType>;
  }
): Promise<{
  consoleFiltersContext: ConsoleFiltersContextType;
  focusContext: FocusContextType;
  renderResult: RenderResult;
  replayClient: ReplayClientInterface;
  sessionContext: SessionContextType;
}> {
  const consoleFiltersContext: ConsoleFiltersContextType = {
    eventTypes: {},
    eventTypesForDisplay: {},
    filterByDisplayText: "",
    filterByText: "",
    isTransitionPending: false,
    showErrors: true,
    showExceptions: true,
    showExceptionsForDisplay: true,
    showLogs: true,
    showNodeModules: true,
    showTimestamps: false,
    showWarnings: true,
    update: jest.fn(),
    ...options?.consoleFiltersContext,
  };

  const focusContext: FocusContextType = {
    isTransitionPending: false,
    range: null,
    rangeForDisplay: null,
    update: jest.fn(),
    ...options?.focusContext,
  };

  const timelineContext: TimelineContextType = {
    executionPoint: "0",
    isPending: false,
    time: 0,
    update: jest.fn(),
    ...options?.timelineContext,
  };

  const pointsContext: PointsContextType = {
    addPoint: jest.fn(),
    deletePoints: jest.fn(),
    editPoint: jest.fn(),
    isPending: false,
    points: [],
    pointsForAnalysis: [],
    ...options?.pointsContext,
  };

  const renderResponse = await render(
    <PointsContext.Provider value={pointsContext}>
      <TimelineContext.Provider value={timelineContext}>
        <FocusContext.Provider value={focusContext}>
          <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
            {children}
          </ConsoleFiltersContext.Provider>
        </FocusContext.Provider>
      </TimelineContext.Provider>
    </PointsContext.Provider>,
    {
      replayClient: options?.replayClient,
      sessionContext: options?.sessionContext,
    }
  );

  return {
    ...renderResponse,
    consoleFiltersContext,
    focusContext,
  };
}

export function setupWindow(): void {
  // @ts-ignore
  window.location = new URL("http://localhost?recordingId=fake");

  globalThis.fetch = fetch;
}

// This mock client is mostly useless by itself,
// but its methods can be overridden individually (or observed/inspected) by test code.
export function createMockReplayClient() {
  return {
    get loadedRegions() {
      return null;
    },
    addEventListener: jest.fn(),
    breakpointAdded: jest.fn(),
    breakpointRemoved: jest.fn(),
    configure: jest.fn().mockImplementation(async () => {}),
    createPause: jest.fn().mockImplementation(async () => ({
      frames: [],
      data: {},
    })),
    evaluateExpression: jest.fn().mockImplementation(async () => ({ data: {} })),
    findKeyboardEvents: jest.fn().mockImplementation(async () => []),
    findMessages: jest.fn().mockImplementation(async () => ({ messages: [], overflow: false })),
    findNavigationEvents: jest.fn().mockImplementation(async () => []),
    findSources: jest.fn().mockImplementation(async () => []),
    getAllFrames: jest.fn().mockImplementation(async () => []),
    getAnnotationKinds: jest.fn().mockImplementation(async () => []),
    getBreakpointPositions: jest.fn().mockImplementation(async () => []),
    getCorrespondingSourceIds: jest.fn().mockImplementation(() => []),
    getCorrespondingLocations: jest.fn().mockImplementation(() => []),
    getEventCountForTypes: jest.fn().mockImplementation(async () => {}),
    getEventCountForType: jest.fn().mockImplementation(async () => 0),
    getHitPointsForLocation: jest.fn().mockImplementation(async () => []),
    getMappedLocation: jest.fn().mockImplementation(async () => []),
    getObjectWithPreview: jest.fn().mockImplementation(async () => ({})),
    getObjectProperty: jest.fn().mockImplementation(async () => ({})),
    getPointNearTime: jest.fn().mockImplementation(async () => ({ point: "0", time: 0 })),
    getPointsBoundingTime: jest.fn().mockImplementation(async () => ({
      before: { point: "0", time: 0 },
      after: { point: "0", time: 0 },
    })),
    getPreferredLocation: jest.fn().mockImplementation(async () => ({})),
    getRecordingCapabilities: jest.fn().mockImplementation(async () => ({
      supportsEventTypes: false,
      supportsNetworkRequests: false,
      supportsRepaintingGraphics: false,
    })),
    getRecordingId: jest.fn().mockImplementation(async () => "fake-recording-id"),
    getSessionEndpoint: jest.fn().mockImplementation(async () => ({
      point: "1000",
      time: 1000,
    })),
    getSessionId: jest.fn().mockImplementation(async () => "fake-session-id"),
    getSourceHitCounts: jest.fn().mockImplementation(async () => new Map()),
    initialize: jest.fn().mockImplementation(async () => {}),
    loadRegion: jest.fn().mockImplementation(async () => {}),
    removeEventListener: jest.fn(),
    runAnalysis: jest.fn().mockImplementation(async () => []),
    searchFunctions: jest.fn().mockImplementation(async () => {}),
    searchSources: jest.fn().mockImplementation(async () => {}),
    streamSourceContents: jest.fn().mockImplementation(async () => {}),
  };
}
