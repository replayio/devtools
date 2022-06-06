import { act, render as rtlRender, RenderResult } from "@testing-library/react";
import { ReactNode } from "react";
import {
  ConsoleFiltersContext,
  ConsoleFiltersContextType,
} from "../contexts/ConsoleFiltersContext";
import { FocusContext, FocusContextType } from "../contexts/FocusContext";
import { ReplayClientContext } from "../contexts/ReplayClientContext";
import { SessionContext, SessionContextType } from "../contexts/SessionContext";
import { ReplayClientInterface } from "../client/ReplayClient";

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
    duration: 1000,
    endPoint: "1000",
    recordingId: "fakeRecordingId",
    sessionId: "fakeSessionId",
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
    filterByDisplayText: "",
    filterByText: "",
    isTransitionPending: false,
    levelFlags: {
      showErrors: true,
      showLogs: true,
      showWarnings: true,
    },
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

  const renderResponse = await render(
    <FocusContext.Provider value={focusContext}>
      <ConsoleFiltersContext.Provider value={consoleFiltersContext}>
        {children}
      </ConsoleFiltersContext.Provider>
    </FocusContext.Provider>,
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

// This mock client is mostly useless by itself,
// but its methods can be overridden individually (or observed/inspected) by test code.
const MockReplayClient = {
  initialize: jest.fn().mockImplementation(async () => {}),
  findMessages: jest.fn().mockImplementation(async () => ({ messages: [], overflow: false })),
  findSources: jest.fn().mockImplementation(async () => {}),
  getPointNearTime: jest.fn().mockImplementation(async () => ({ point: "0", time: 0 })),
  getSessionEndpoint: jest.fn().mockImplementation(async () => ({
    point: "1000",
    time: 1000,
  })),
};
