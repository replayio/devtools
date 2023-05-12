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
    update: jest.fn(),
    updateForTimelineImprecise: jest.fn(),
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
    pointsTransitionPending: false,
    deletePoints: jest.fn(),
    discardPendingPoint: jest.fn(),
    editPendingPoint: jest.fn(),
    editPointBadge: jest.fn(),
    editPointBehavior: jest.fn(),
    pointBehaviorsForSuspense: {},
    pointBehaviorsForDefaultPriority: {},
    pointsForSuspense: [],
    pointsForDefaultPriority: [],
    savePendingPoint: jest.fn(),
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
  const mockClient = mock<ReplayClientInterface>();
  mockClient.addEventListener.mockImplementation(() => {});
  mockClient.createPause.mockImplementation(async () => ({
    data: {},
    pauseId: "fake",
  }));
  mockClient.getAllFrames.mockImplementation(async () => ({ frames: [], data: {} }));
  mockClient.getBreakpointPositions.mockImplementation(async () => []);
  mockClient.getPointsBoundingTime.mockImplementation(async time => ({
    before: { point: String(time), time },
    after: { point: String(time), time },
  }));
  mockClient.getPointNearTime.mockImplementation(async time => ({ point: String(time), time }));
  mockClient.getSessionEndpoint.mockImplementation(async () => ({
    point: "1000",
    time: 1000,
  }));
  mockClient.findKeyboardEvents.mockImplementation(async () => {});
  mockClient.findMessages.mockImplementation(async () => ({ messages: [], overflow: false }));
  mockClient.findMessagesInRange.mockImplementation(async () => ({
    messages: [],
    overflow: false,
  }));
  mockClient.findNavigationEvents.mockImplementation(async () => {});
  mockClient.findSources.mockImplementation(async () => []);
  mockClient.removeEventListener.mockImplementation(() => {});

  return mockClient;
}

export type MockReplayClientInterface = ReturnType<typeof createMockReplayClient>;
