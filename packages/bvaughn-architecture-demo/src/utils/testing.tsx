import { act, render as rtlRender, RenderResult } from "@testing-library/react";
import fetch from "isomorphic-fetch";
import { ReactNode } from "react";
import { ReplayClientInterface } from "shared/client/types";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  ConsoleFiltersContext,
  ConsoleFiltersContextType,
} from "../contexts/ConsoleFiltersContext";
import { FocusContext, FocusContextType } from "../contexts/FocusContext";
import { SessionContext, SessionContextType } from "../contexts/SessionContext";
import { PauseContext, PauseContextType } from "../contexts/PauseContext";
import { PointsContext, PointsContextType } from "../contexts/PointsContext";

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
    ...MockReplayClient,
    ...options?.replayClient,
  };

  const sessionContext: SessionContextType = {
    accessToken: null,
    currentUserInfo: null,
    duration: 1000,
    endPoint: "1000",
    recordingId: "fakeRecordingId",
    sessionId: "fakeSessionId",
    sourceIds: [],
    ...options?.sessionContext,
  };

  let renderResult: RenderResult = null as any;
  await act(async () => {
    const result = rtlRender(
      <ReplayClientContext.Provider value={replayClient}>
        <SessionContext.Provider value={sessionContext}>{children}</SessionContext.Provider>
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
    pauseContext?: Partial<PauseContextType>;
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
    events: {},
    filterByDisplayText: "",
    filterByText: "",
    isTransitionPending: false,
    showErrors: true,
    showExceptions: true,
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

  const pauseContext: PauseContextType = {
    isPending: false,
    pauseId: null,
    update: jest.fn(),
    ...options?.pauseContext,
  };

  const pointsContext: PointsContextType = {
    addPoint: jest.fn(),
    deletePoint: jest.fn(),
    editPoint: jest.fn(),
    isPending: false,
    points: [],
    pointsForAnalysis: [],
    ...options?.pointsContext,
  };

  const renderResponse = await render(
    <PointsContext.Provider value={pointsContext}>
      <PauseContext.Provider value={pauseContext}>
        <FocusContext.Provider value={focusContext}>
          <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
            {children}
          </ConsoleFiltersContext.Provider>
        </FocusContext.Provider>
      </PauseContext.Provider>
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
const MockReplayClient = {
  configure: jest.fn().mockImplementation(async () => {}),
  findMessages: jest.fn().mockImplementation(async () => ({ messages: [], overflow: false })),
  findSources: jest.fn().mockImplementation(async () => []),
  getAllFrames: jest.fn().mockImplementation(async () => []),
  getHitPointsForLocation: jest.fn().mockImplementation(async () => []),
  getObjectWithPreview: jest.fn().mockImplementation(async () => ({})),
  getPointNearTime: jest.fn().mockImplementation(async () => ({ point: "0", time: 0 })),
  getRecordingId: jest.fn().mockImplementation(async () => "fake-recording-id"),
  getSessionEndpoint: jest.fn().mockImplementation(async () => ({
    point: "1000",
    time: 1000,
  })),
  getSessionId: jest.fn().mockImplementation(async () => "fake-session-id"),
  getSourceContents: jest.fn().mockImplementation(async () => ({
    contents: "fake-source-contents",
    contentType: "text/javascript",
  })),
  getSourceHitCounts: jest.fn().mockImplementation(async () => new Map()),
  initialize: jest.fn().mockImplementation(async () => {}),
  runAnalysis: jest.fn().mockImplementation(async () => ({})),
};
