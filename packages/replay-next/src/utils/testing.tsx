import { TimeStampedPointRange } from "@replayio/protocol";
import { RenderResult, act, render as rtlRender } from "@testing-library/react";
import fetch from "isomorphic-fetch";
import { mock } from "jest-mock-extended";
import { ReactNode } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import {
  ConsoleFiltersContext,
  ConsoleFiltersContextRoot,
  ConsoleFiltersContextType,
} from "../contexts/ConsoleFiltersContext";
import { FocusContext, FocusContextType } from "../contexts/FocusContext";
import { PointsContext, PointsContextType } from "../contexts/points/PointsContext";
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
    endpoint: "1000",
    recordingId: "fakeRecordingId",
    sessionId: "fakeSessionId",
    refetchUser: () => {},
    trackEvent: () => {},
    trackEventOnce: () => {},
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
    enterFocusMode: () => {},
    isTransitionPending: false,
    range: null,
    rangeForDisplay: null,
    rangeForSuspense: null,
    update: jest.fn(),
    updateForTimelineImprecise: jest.fn(),
    ...options?.focusContext,
  };

  const timelineContext: TimelineContextType = {
    executionPoint: "0",
    isPending: false,
    pauseId: null,
    time: 0,
    update: jest.fn(),
    ...options?.timelineContext,
  };

  const pointsContext: PointsContextType = {
    addPoint: jest.fn(),
    pointsTransitionPending: false,
    deletePoints: jest.fn(),
    discardPendingPointText: jest.fn(),
    editPendingPointText: jest.fn(),
    editPointBadge: jest.fn(),
    editPointBehavior: jest.fn(),
    pointBehaviorsForSuspense: {},
    pointBehaviorsForDefaultPriority: {},
    pointsForSuspense: [],
    pointsForDefaultPriority: [],
    pointsWithPendingEdits: [],
    savePendingPointText: jest.fn(),
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

function timeToFakeExecutionPoint(time: number): string {
  return String(Math.round(time * 1_000));
}

// This mock client is mostly useless by itself,
// but its methods can be overridden individually (or observed/inspected) by test code.
export function createMockReplayClient() {
  let focusWindow: TimeStampedPointRange = {
    begin: { time: 0, point: "0" },
    end: { time: 1_000, point: timeToFakeExecutionPoint(1_000) },
  };
  const mockClient = mock<ReplayClientInterface>();
  mockClient.addEventListener.mockImplementation(() => {});
  mockClient.createPause.mockImplementation(async () => ({
    data: {},
    pauseId: "fake",
  }));
  mockClient.getAllFrames.mockImplementation(async () => ({ frames: [], data: {} }));
  mockClient.getBreakpointPositions.mockImplementation(async () => []);
  mockClient.getPointsBoundingTime.mockImplementation(async time => ({
    before: { point: timeToFakeExecutionPoint(time), time },
    after: { point: timeToFakeExecutionPoint(time), time },
  }));
  mockClient.getPointNearTime.mockImplementation(async time => ({
    point: timeToFakeExecutionPoint(time),
    time,
  }));
  mockClient.getSessionEndpoint.mockImplementation(async () => ({
    point: timeToFakeExecutionPoint(1_000),
    time: 1_000,
  }));
  mockClient.findKeyboardEvents.mockImplementation(async () => []);
  mockClient.findMessages.mockImplementation(async () => ({ messages: [], overflow: false }));
  mockClient.findMessagesInRange.mockImplementation(async () => ({
    messages: [],
    overflow: false,
  }));
  mockClient.findMouseEvents.mockImplementation(async () => []);
  mockClient.findNavigationEvents.mockImplementation(async () => []);
  mockClient.findSources.mockImplementation(async () => []);
  mockClient.removeEventListener.mockImplementation(() => {});
  mockClient.getCurrentFocusWindow.mockImplementation(() => null);
  mockClient.waitForSession.mockImplementation(() => Promise.resolve(""));
  mockClient.requestFocusWindow.mockImplementation(({ begin, end }) => {
    focusWindow = { begin: begin!, end: end! };
    return Promise.resolve(focusWindow);
  });
  mockClient.getCurrentFocusWindow.mockImplementation(() => focusWindow);
  mockClient.streamSourceContents.mockImplementation(
    (sourceId, onSourceContentsInfo, onSourceContentsChunk) => {
      onSourceContentsInfo({
        codeUnitCount: 0,
        contentType: "text/javascript",
        lineCount: 0,
        sourceId,
      });
      return Promise.resolve();
    }
  );

  return mockClient;
}

export type MockReplayClientInterface = ReturnType<typeof createMockReplayClient>;
