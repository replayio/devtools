// Side-effectful import, has to be imported before event-listeners
// Ordering matters here
import { ActionCreatorWithoutPayload, bindActionCreators } from "@reduxjs/toolkit";
import { sessionError, uploadedData } from "@replayio/protocol";
import { IDBPDatabase, openDB } from "idb";

import { setupSourcesListeners } from "devtools/client/debugger/src/actions/sources";
import * as dbgClient from "devtools/client/debugger/src/client";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import {
  Canvas,
  setPausedonPausedAtTimeCallback,
  setPlaybackStatusCallback,
  setRefreshGraphicsCallback,
  setupGraphics,
} from "protocol/graphics";
// eslint-disable-next-line no-restricted-imports
import { addEventListener, initSocket, client as protocolClient } from "protocol/socket";
import { assert } from "protocol/utils";
import { buildIdCache, parseBuildIdComponents } from "replay-next/src/suspense/BuildIdCache";
import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";
import { CONSOLE_SETTINGS_DATABASE, POINTS_DATABASE } from "shared/user-data/IndexedDB/config";
import { IDBOptions } from "shared/user-data/IndexedDB/types";
import { UIStore, actions } from "ui/actions";
import { setCanvas } from "ui/actions/app";
import { precacheScreenshots } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import app from "ui/reducers/app";
import network from "ui/reducers/network";
import protocolMessages from "ui/reducers/protocolMessages";
import timeline, { setPlaybackStalled } from "ui/reducers/timeline";
import { setUpUrlParamsListener } from "ui/setup/dynamic/url";
import { UIState } from "ui/state";
import { ExpectedError, UnexpectedError } from "ui/state/app";
import {
  REACT_ANNOTATIONS_KIND,
  REDUX_ANNOTATIONS_KIND,
  annotationKindsCache,
  eventListenersJumpLocationsCache,
  reactDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";
import type { ThunkExtraArgs } from "ui/utils/thunk";

import { startAppListening } from "../listenerMiddleware";
import { AppStore, extendStore } from "../store";

const { setupApp, setupTimeline } = actions;

declare global {
  interface Window {
    hasAlreadyBootstrapped: boolean;
  }
  interface AppHelpers {
    actions?: ResolveThunks<typeof actions>;
    selectors?: BoundSelectors;
    debugger?: any;

    PointsContext?: any;
    SourcesCache?: any;
    replayClient?: ReplayClientInterface;
  }
}

enum SessionError {
  UnexpectedClose = 1,
  BackendDeploy = 2,
  NodeTerminated = 3,
  KnownFatalError = 4,
  UnknownFatalError = 5,
  OldBuild = 6,
  LongRecording = 7,
  InactivityTimeout = 10,
}

const defaultMessaging: UnexpectedError = {
  action: "refresh",
  content: "Something went wrong while replaying, we'll look into it as soon as possible.",
  message: "Our apologies!",
};

async function getSessionErrorMessages(replayClient: ReplayClientInterface) {
  const buildId = await buildIdCache.readAsync(replayClient);
  const buildComponents = parseBuildIdComponents(buildId);
  const isWindows = buildComponents?.platform === "windows";
  const isFirefox = buildComponents?.runtime === "gecko";

  // Reported reasons why a session can be destroyed.
  const sessionErrorMessages: Record<number, Partial<ExpectedError>> = {
    [SessionError.BackendDeploy]: {
      content: "Please wait a few minutes and try again.",
    },
    [SessionError.NodeTerminated]: {
      content: "Our servers hiccuped but things should be back to normal soon.",
    },
    [SessionError.UnknownFatalError]: {
      content:
        isWindows && isFirefox
          ? "The browser replayed an event out of order. We are hoping to release a new Chrome based browser in a couple of months which will be more reliable. Thanks for your patience 🙏"
          : "Refreshing should help.\nIf not, please try recording again.",
      action: "refresh",
      message: isWindows ? "Windows replaying error" : "Replaying error",
    },
    [SessionError.KnownFatalError]: {
      content:
        "This error has been fixed in an updated version of Replay. Please try upgrading Replay and trying a new recording.",
    },
    [SessionError.OldBuild]: {
      content: "This recording is no longer available. Please try recording a new replay.",
    },
    [SessionError.LongRecording]: {
      content: "You’ve hit an error that happens with long recordings. Can you try a shorter one?",
    },
    [SessionError.InactivityTimeout]: {
      content: "This replay timed out to reduce server load.",
      message: "Ready when you are!",
    },
  };
  return sessionErrorMessages;
}

export default async function setupDevtools(store: AppStore, replayClient: ReplayClientInterface) {
  if (window.hasAlreadyBootstrapped) {
    return;
  } else {
    window.hasAlreadyBootstrapped = true;
  }

  const url = new URL(window.location.href);
  const dispatchUrl = url.searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL;
  assert(dispatchUrl, "no dispatchUrl");

  const justSelectors = Object.fromEntries(
    Object.entries(selectors).filter(([key, value]) => {
      // The "selectors" object actually contains action creators, selectors, and other random bits.
      // We want to filter it down to _just_ selectors if possible.
      // We can eliminate anything that's not a function, _and_ anything that _appears_
      // to be an RTK action creator.  Technially a few non-selectors will sneak through at runtime,
      // but the runtime fields should _mostly_ match the TS types here.
      return (
        typeof value === "function" &&
        typeof (value as ActionCreatorWithoutPayload).type !== "string"
      );
    })
  ) as ObjectOfJustSelectorsHopefully;

  window.app = window.app || {};
  // @ts-expect-error complains about thunk type mismatches
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors(store, justSelectors);
  window.app.replayClient = replayClient;

  const initialState = {};

  const reducers = {
    app,
    network,
    timeline,
    protocolMessages: protocolMessages,
    ...debuggerReducers,
  };

  const extraThunkArgs: ThunkExtraArgs = {
    replayClient,
    protocolClient,
    objectCache,
  };

  // Add all these new slice reducers and some related state in a single call,
  // which avoids weirdness in local dev with the Redux DevTools not passing in
  // state from earlier if there's multiple `extendStore` calls
  extendStore(store, initialState, { ...reducers, ...inspectorReducers }, extraThunkArgs);

  setupSourcesListeners(startAppListening);

  dbgClient.bootstrap(store, replayClient);

  const socket = initSocket(dispatchUrl);
  if (typeof window !== "undefined") {
    if (window.app != null) {
      // @ts-ignore
      window.app.socket = socket;
    }
  }

  addEventListener("Recording.uploadedData", (data: uploadedData) =>
    store.dispatch(actions.onUploadedData(data))
  );

  addEventListener("Recording.awaitingSourcemaps", () =>
    store.dispatch(actions.setAwaitingSourcemaps(true))
  );

  addEventListener("Recording.sessionError", async (error: sessionError) => {
    const sessionErrorMessages = await getSessionErrorMessages(replayClient);
    store.dispatch(
      actions.setExpectedError({
        ...defaultMessaging,
        ...error,
        ...sessionErrorMessages[error.code],
      })
    );
  });

  setupApp(store, replayClient);
  setupTimeline(store);
  setupGraphics(store);

  networkRequestsCache.prefetch(replayClient);

  replayClient.waitForSession().then(() => {
    // Precache annotations
    annotationKindsCache.prefetch(replayClient, REACT_ANNOTATIONS_KIND);
    annotationKindsCache.prefetch(replayClient, REDUX_ANNOTATIONS_KIND);
    reactDevToolsAnnotationsCache.prefetch(replayClient);
    eventListenersJumpLocationsCache.prefetch(replayClient);
  });

  // Add protocol event listeners for things that the Redux store needs to stay in sync with.
  // TODO We should revisit this as part of a larger architectural redesign (#6932).

  setPausedonPausedAtTimeCallback((time: number) => {
    store.dispatch(precacheScreenshots(time));
  });
  setPlaybackStatusCallback((stalled: boolean) => {
    store.dispatch(setPlaybackStalled(stalled));
  });

  setRefreshGraphicsCallback((canvas: Canvas) => {
    store.dispatch(setCanvas(canvas));
  });

  setUpUrlParamsListener(store, replayClient);
}

interface MigrationSetting {
  regexp: RegExp;
  database: IDBOptions;
  storeName: string;
}

// The new console and points logic was storing per-recording values in `localStorage`,
// with unique keys per recording ID. That was cluttering up `localStorage`.
// We've switched to storing per-recording values in IndexedDB.
// Migrate existing settings from `localStorage` to IDB.
const settingsToMigrate: MigrationSetting[] = [
  {
    regexp: /^(?<recordingId>.+)::points$/,
    database: POINTS_DATABASE,
    storeName: "points",
  },
  {
    regexp: /^(?<recordingId>.+)::terminalExpressionHistory$/,
    database: CONSOLE_SETTINGS_DATABASE,
    storeName: "terminalHistory",
  },
  {
    regexp: /^Replay:showExceptions:(?<recordingId>.+)$/,
    database: CONSOLE_SETTINGS_DATABASE,
    storeName: "showExceptions",
  },
  {
    regexp: /^Replay:Toggles:(?<recordingId>.+)$/,
    database: CONSOLE_SETTINGS_DATABASE,
    storeName: "filterToggles",
  },
];

const keysToDelete: RegExp[] = [
  /^Replay:Console:MenuOpen:(?<recordingId>.+)$/,
  /^(?<recordingId>.+)::expressionHistory$/,
];

export async function migratePerRecordingPersistedSettings() {
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.indexedDB !== "undefined"
  ) {
    const allLocalStorageKeys = Object.keys(localStorage);

    for (let migration of settingsToMigrate) {
      let dbInstance: IDBPDatabase | null = null;
      try {
        const { databaseName, databaseVersion, storeNames } = migration.database;
        dbInstance = await openDB(databaseName, databaseVersion, {
          upgrade(db) {
            // The "upgrade" callback runs both on initial creation (when a DB does not exist),
            // and on version number change.
            for (let storeName of storeNames) {
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
              }
            }
          },
        });

        const matchingEntries = allLocalStorageKeys.filter(key => migration.regexp.test(key));

        for (let key of matchingEntries) {
          const storedValue = localStorage.getItem(key);
          const match = key.match(migration.regexp)!;
          const { recordingId } = match!.groups!;
          if (storedValue) {
            const actualValue = JSON.parse(storedValue);
            if (Array.isArray(actualValue) && actualValue.length === 0) {
              // Remove empty array items - they're a leftover default
              localStorage.removeItem(key);
              continue;
            }

            await dbInstance.put(migration.storeName, actualValue, recordingId);
            localStorage.removeItem(key);
          }
        }
      } catch (err) {
        continue;
      } finally {
        if (dbInstance) {
          dbInstance.close();
        }
      }
    }

    for (let regexp of keysToDelete) {
      const matchingKeys = allLocalStorageKeys.filter(key => regexp.test(key));

      for (let key of matchingKeys) {
        localStorage.removeItem(key);
      }
    }
  }
}

// The original Big Ball O' Exports containing selectors + other fields
type SelectorsObject = typeof selectors;

// We expect that all Redux selectors take `state` as the first arg
type ReduxSelectorFunction = ((state: UIState, ...any: any[]) => any) | ((state: UIState) => any);

// Do TS type transforms to extract "an object with just Redux selectors"
type ObjectOfJustSelectorsHopefully = Pick<
  SelectorsObject,
  KeysAssignableToType<SelectorsObject, ReduxSelectorFunction>
>;

type SelectorWithoutStateArg<T extends ReduxSelectorFunction> = (
  ...args: Tail<Parameters<T>>
) => ReturnType<T>;

// When we "bind" the selectors, we automatically pass in `state` as the first arg.
// Create TS types that reflect that by removing the first arg from the type signature,
// but still expect any other parameters.
export type BoundSelectors = {
  [key in keyof ObjectOfJustSelectorsHopefully]: SelectorWithoutStateArg<
    ObjectOfJustSelectorsHopefully[key]
  >;
};

export function bindSelectors(store: UIStore, selectors: Partial<ObjectOfJustSelectorsHopefully>) {
  // NOTE: While the object is named `selectors`, our use of `export * from someSlice`
  // has caused a lot of action creators to be in the object as well.
  // Additionally, the "binding" of passing in `state` automatically messes up the TS types here.
  // I've attempted to get TS to accept that this is valid.
  return Object.entries(selectors).reduce((bound, [key, originalSelector]) => {
    bound[key as keyof BoundSelectors] = (...args: any[]) =>
      // @ts-expect-error
      originalSelector(store.getState(), ...args);
    return bound;
  }, {} as BoundSelectors);
}

export type UnknownFunction = (...args: any[]) => any;

type KeysAssignableToType<O extends object, T> = {
  [K in keyof O]-?: O[K] extends T ? K : never;
}[keyof O];

export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never;

// Stolen from React-Redux. Cuts out the "returns a thunk function"
// part of a thunk action creator to reflect how it works when dispatched.
export type InferThunkActionCreatorType<TActionCreator extends (...args: any[]) => any> =
  TActionCreator extends (...args: infer TParams) => (...args: any[]) => infer TReturn
    ? (...args: TParams) => TReturn
    : TActionCreator;

export type HandleThunkActionCreator<TActionCreator> = TActionCreator extends (
  ...args: any[]
) => any
  ? InferThunkActionCreatorType<TActionCreator>
  : TActionCreator;

// redux-thunk middleware returns thunk's return value from dispatch call
// https://github.com/reduxjs/redux-thunk#composition
export type ResolveThunks<TDispatchProps> = TDispatchProps extends {
  [key: string]: any;
}
  ? {
      [C in keyof TDispatchProps]: HandleThunkActionCreator<TDispatchProps[C]>;
    }
  : TDispatchProps;
