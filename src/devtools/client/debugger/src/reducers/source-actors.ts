/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { AnyAction, Action } from "@reduxjs/toolkit";
import sortBy from "lodash/sortBy";
import type { UIState } from "ui/state";

import { AsyncValue } from "../utils/async-value";
import {
  createInitial,
  insertResources,
  updateResources,
  removeResources,
  hasResource,
  getMappedResource,
  makeIdQuery,
  makeReduceAllQuery,
} from "../utils/resource";
import type { ResourceState } from "../utils/resource/core";

import type { HitCount } from "./sources";

export type LineRange = { min: number; max: number };

export interface SourceActor {
  actor: string;
  id: string;
  introductionType?: string | null;
  introductionUrl?: string | null;
  isBlackBoxed?: boolean;
  source: string;
  sourceMapURL?: string;
  thread: string;
  url: string;
  breakpointHitCountLinesKnown?: LineRange[];
  breakpointPositions?: Map<number, AsyncValue<number[]>>;
  breakpointHitCounts?: HitCount[] | null;
}

export type SourceActorsState = ResourceState<SourceActor>;

const initial: SourceActorsState = createInitial<SourceActor>();

interface InsertSourceActorsAction extends Action<"INSERT_SOURCE_ACTORS"> {
  items: SourceActor[];
}

interface RemoveSourceActorsAction extends Action<"REMOVE_SOURCE_ACTORS"> {
  items: SourceActor[];
}

export default function update(state = initial, action: AnyAction) {
  switch (action.type) {
    case "INSERT_SOURCE_ACTORS": {
      const { items } = action as InsertSourceActorsAction;
      state = insertResources(
        state,
        items.map(item => ({
          ...item,
        }))
      );
      break;
    }
    case "REMOVE_SOURCE_ACTORS": {
      const { items } = action as RemoveSourceActorsAction;
      state = removeResources(state, items);
      break;
    }

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
const mergeRanges = (ranges: LineRange[]): LineRange[] => {
  return sortBy(ranges, r => r.min).reduce((acc: LineRange[], curr) => {
    if (!acc.length) {
      return [curr];
    }
    const last = acc.pop()!;
    if (last.max >= curr.min) {
      acc.push({ max: Math.max(last.max, curr.max), min: last.min });
    } else {
      acc.push(last);
      acc.push(curr);
    }
    return acc;
  }, []);
};

export function resourceAsSourceActor({ breakpointPositions, ...sourceActor }: SourceActor) {
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
