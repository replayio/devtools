/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction, Action } from "@reduxjs/toolkit";

import type { UIState } from "ui/state";
import { asSettled, asyncActionAsValue, AsyncValue } from "../utils/async-value";
import {
  createInitial,
  insertResources,
  updateResources,
  removeResources,
  hasResource,
  getResource,
  getMappedResource,
  makeWeakQuery,
  makeIdQuery,
  makeReduceAllQuery,
} from "../utils/resource";
import type { ResourceState } from "../utils/resource/core";
import type { HitCount } from "./sources";

export interface SourceActor {
  actor: string;
  id: string;
  introductionType?: unknown;
  introductionUrl?: string;
  source: string;
  sourceMapURL?: string;
  thread: string;
  url: string;
  min?: number;
  max?: number;
  breakableLines?: AsyncValue<number[]> | null;
  breakpointPositions?: Map<number, AsyncValue<number[]>>;
  breakpointHitCounts: HitCount[] | null;
}

export type SourceActorsState = ResourceState<SourceActor>;

const initial: SourceActorsState = createInitial<SourceActor>();

interface InsertSourceActorsAction extends Action<"INSERT_SOURCE_ACTORS"> {
  items: SourceActor[];
}

interface RemoveSourceActorsAction extends Action<"REMOVE_SOURCE_ACTORS"> {
  items: SourceActor[];
}

interface SetSourceActorBreakpointColumnsAction
  extends Action<"SET_SOURCE_ACTOR_BREAKPOINT_COLUMNS"> {
  sourceId: string;
  line: number;
  value: number[];
  status: "start" | "error" | "done";
}

interface SetSourceActorBreakpointHitCountsAction
  extends Action<"SET_SOURCE_ACTOR_BREAKPOINT_HIT_COUNTS"> {
  id: string;
  line: number;
  value: {
    hits: HitCount[];
    min: number;
    max: number;
  };
  status: "start" | "error" | "done";
}

interface SetSourceActorBreakableLinesAction extends Action<"SET_SOURCE_ACTOR_BREAKABLE_LINES"> {
  sourceId: string;
  line: number;
  value: number[];
  status: "start" | "error" | "done";
}

export default function update(state = initial, action: AnyAction) {
  switch (action.type) {
    case "INSERT_SOURCE_ACTORS": {
      const { items } = action as InsertSourceActorsAction;
      state = insertResources(
        state,
        items.map(item => ({
          ...item,
          breakpointPositions: new Map(),
          breakableLines: null,
        }))
      );
      break;
    }
    case "REMOVE_SOURCE_ACTORS": {
      const { items } = action as RemoveSourceActorsAction;
      state = removeResources(state, items);
      break;
    }

    case "SET_SOURCE_ACTOR_BREAKPOINT_COLUMNS":
      state = updateBreakpointColumns(state, action as SetSourceActorBreakpointColumnsAction);
      break;

    case "SET_SOURCE_ACTOR_BREAKPOINT_HIT_COUNTS":
      state = updateBreakpointHitCounts(state, action as SetSourceActorBreakpointHitCountsAction);
      break;

    case "set_trim_region":
      state.values = clearBreakpointHitCounts(state);
      break;

    case "SET_SOURCE_ACTOR_BREAKABLE_LINES":
      state = updateBreakableLines(state, action as SetSourceActorBreakableLinesAction);
      break;

    case "CLEAR_SOURCE_ACTOR_MAP_URL":
      state = clearSourceActorMapURL(state, action.id);
      break;
  }

  return state;
}

function clearSourceActorMapURL(state: SourceActorsState, id: string) {
  if (!hasResource(state, id)) {
    return state;
  }

  return updateResources(state, [
    {
      id,
      sourceMapURL: "",
    },
  ]);
}

function updateBreakpointColumns(
  state: SourceActorsState,
  action: SetSourceActorBreakpointColumnsAction
) {
  const { sourceId, line } = action;
  // @ts-ignore start/done mismatch
  const value = asyncActionAsValue<number[]>(action);

  if (!hasResource(state, sourceId)) {
    return state;
  }

  const breakpointPositions = new Map(getResource(state, sourceId).breakpointPositions!);
  breakpointPositions.set(line, value);

  return updateResources(state, [{ id: sourceId, breakpointPositions }]);
}

function updateBreakableLines(
  state: SourceActorsState,
  action: SetSourceActorBreakableLinesAction
) {
  // @ts-ignore start/done mismatch
  const value = asyncActionAsValue<SetSourceActorBreakableLinesAction["value"]>(action);
  const { sourceId } = action;

  if (!hasResource(state, sourceId)) {
    return state;
  }

  return updateResources(state, [{ id: sourceId, breakableLines: value }]);
}

function updateBreakpointHitCounts(
  state: SourceActorsState,
  action: SetSourceActorBreakpointHitCountsAction
) {
  // @ts-ignore start/done mismatch
  const value = asyncActionAsValue<SetSourceActorBreakpointHitCountsAction["value"]>(action);
  if (value.state === "pending") {
    return state;
  }

  const { id: sourceId } = action;

  if (!hasResource(state, sourceId)) {
    return state;
  }

  const {
    min: currentMin,
    max: currentMax,
    breakpointHitCounts: currentBreakpointHitCounts,
  } = {
    min: Infinity,
    max: 0,
    // @ts-ignore always overwritten
    breakpointHitCounts: [],
    ...state.values[sourceId],
  };

  return updateResources(state, [
    {
      id: sourceId,
      breakpointHitCounts: [...currentBreakpointHitCounts!, ...action.value.hits],
      min: Math.min(currentMin, action.value.min),
      max: Math.max(currentMax, action.value.max),
    },
  ]);
}

function clearBreakpointHitCounts(state: SourceActorsState) {
  const withoutBreakpointHitCounts = makeReduceAllQuery<
    SourceActor,
    SourceActor,
    Record<string, SourceActor>
  >(
    x => x,
    actors => {
      return actors.reduce((acc, actor) => {
        acc[actor.id] = {
          ...actor,
          breakpointHitCounts: null,
        };
        return acc;
      }, {} as Record<string, SourceActor>);
    }
  );
  return withoutBreakpointHitCounts(state);
}

export function resourceAsSourceActor({
  breakpointPositions,
  breakableLines,
  ...sourceActor
}: SourceActor) {
  return sourceActor;
}

export function hasSourceActor(state: UIState, id: string) {
  return hasResource(state.sourceActors, id);
}

export function getSourceActor(state: UIState, id: string) {
  return getMappedResource(state.sourceActors, id, resourceAsSourceActor);
}

/**
 * Get all of the source actors for a set of IDs. Caches based on the identity
 * of "ids" when possible.
 */
const querySourceActorsById = makeIdQuery(resourceAsSourceActor);

export function getSourceActors(state: UIState, ids: string[]) {
  return querySourceActorsById(state.sourceActors, ids);
}

const querySourcesByThreadID = makeReduceAllQuery(resourceAsSourceActor, actors => {
  return actors.reduce((acc, actor) => {
    acc[actor.thread] = acc[actor.thread] || [];
    acc[actor.thread].push(actor);
    return acc;
  }, {} as Record<string, SourceActor[]>);
});

export function getSourceActorsForThread(state: UIState, ids: string[]) {
  const sourcesByThread = querySourcesByThreadID(state.sourceActors);

  let sources: SourceActor[] = [];
  for (const id of Array.isArray(ids) ? ids : [ids]) {
    sources = sources.concat(sourcesByThread[id] || []);
  }
  return sources;
}

const queryThreadsBySourceObject = makeReduceAllQuery<
  SourceActor,
  Pick<SourceActor, "thread" | "source">,
  Record<string, string[]>
>(
  actor => ({ thread: actor.thread, source: actor.source }),
  actors =>
    actors.reduce((acc, { source, thread }) => {
      let sourceThreads = acc[source];
      if (!sourceThreads) {
        sourceThreads = [];
        acc[source] = sourceThreads;
      }

      sourceThreads.push(thread);
      return acc;
    }, {} as Record<string, string[]>)
);

export function getAllThreadsBySource(state: UIState) {
  return queryThreadsBySourceObject(state.sourceActors);
}

export function getSourceActorBreakpointHitCounts(state: UIState, id: string, lineNumber: number) {
  const { breakpointHitCounts, min, max } = getResource(state.sourceActors, id);
  // It's important for `memoizableAction` that we don't return a promise for a
  // different line range (for instance, returning a promise when line 1001 is
  // requested, even though we are only currently loading lines 1-1000). This is
  // why we keep track of the min and max requested.
  if (!breakpointHitCounts || max! < lineNumber || min! > lineNumber) {
    return null;
  }
  return breakpointHitCounts;
}

export function getSourceActorBreakableLines(state: UIState, id: string) {
  const { breakableLines } = getResource(state.sourceActors, id);

  return breakableLines;
}

export function getSourceActorBreakpointColumns(state: UIState, id: string, line: number) {
  const { breakpointPositions } = getResource(state.sourceActors, id);

  return asSettled<number[]>(breakpointPositions!.get(line)!);
}

export const getBreakableLinesForSourceActors = makeWeakQuery<
  SourceActor,
  SourceActor["breakableLines"],
  unknown[],
  string[]
>({
  filter: (state, ids: string[]) => ids,
  map: ({ breakableLines }: SourceActor) => breakableLines,
  reduce: items =>
    Array.from(
      items.reduce((acc, item) => {
        if (item && item.state === "fulfilled") {
          acc = acc.concat(item.value);
        }
        return acc;
      }, [] as unknown[])
    ),
});
