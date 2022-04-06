# Source Actors Reducer Notes

## Actions Handled

["INSERT_SOURCE_ACTORS", "REMOVE_SOURCE_ACTORS", "NAVIGATE", "SET_SOURCE_ACTOR_BREAKPOINT_COLUMNS", "SET_SOURCE_ACTOR_BREAKPOINT_HIT_COUNTS", "set_trim_region", "SET_SOURCE_ACTOR_BREAKABLE_LINES", "CLEAR_SOURCE_ACTOR_MAP_URL"]

## State

The slice state is just a "resource" table for `SourceActor`s:

```ts
interface SourceActor {
  actor: string;
  id: string;
  introductionType?: unknown;
  introductionUrl?: string;
  source: string;
  sourceMapURL?: string;
  thread: string;
  url: string;
  breakableLines?: unknown | null;
  breakpointPositions?: Map<unknown, unknown>;
}

type SourceActorsState = ResourceState<SourceActor>;
```

## Cases

### `"INSERT_SOURCE_ACTORS"`

Just inserts resource entries from `action.items`, and adds `{breakpointPositions: new Map(), breakableLines: null}` to each.

Dispatched by: `actions/newSources.js` line 254

**Note**: also handled by the `sources` reducer

### `"REMOVE_SOURCE_ACTORS"`

Just removes the matching entries.

- **Dead**: dispatched in a `removeSourceActors` thunk, but that is not used anywhere

### `"SET_SOURCE_ACTOR_BREAKPOINT_COLUMNS"`

Updates an entry for the given `line` and `sourceId`, by recreating a `Map` and calling `breakpointPosition.set(line, value)`, then updating the resource entry.

Dispatched by: `actions/source-actors.js` line 46, inside the `loadSourceActorBreakpointColumns` memoized action

### `"SET_SOURCE_ACTOR_BREAKPOINT_HIT_COUNTS"`

Overwrites the `breakableLines` field in a resource entry, if it isn't `"pending"`.

Dispatched by: `actions/source-actors.js` line 93, inside the `loadSourceActorBreakpointHitCounts` memoized action

### `"set_trim_region"`

Updates `state.values` by setting every `breakpointHitCounts` field to null.

**Note**: currently mutates `state.values =`

Dispatched by: `ui/actions/timeline.ts` in `updateFocusRegion()` and `enterFocusMode()`; `ui/components/shared/FocusModal.tsx`; `ui/components/Timeline/Focuser.tsx`

### `"SET_SOURCE_ACTOR_BREAKABLE_LINES"`

Overwrites the `breakableLines` field in a resource entry.

Dispatched by: `actions/source-actors.js` line 70, inside the `loadSourceActorBreakableLines` memoized action

### `"CLEAR_SOURCE_ACTOR_MAP_URL"`

Sets the `sourceMapURL` field in a resource entry to an empty string.

- **Dead**: not dispatched anywhere

## Other Functions

### `clearSouceActorMapURL`

Just sets the `sourceMapURL` field in a resource entry to an empty string.

### `updateBreakpointColumns`

Clones the `breakpointPositions` `Map` from a resource, adds a line entry, and overwrites the field.

### `updateBreakableLines`

Overwrites the `breakableLines` field in a resource.

### `updateBreakpointHitCounts`

Concatenates a `hits` array to `breakpointHitCounts` in a resource, and also updates the `min/max` fields.

### `clearBreakpointHitCounts`

Generates a new `values` record with every entry's `breakpointHitCounts` field set to `null`

### Resource Selectors

- `resourceAsSourceActor`: pulls out all source actor fields other than `breakpointPositions` and `breakableLines`
- `hasSourceActor`
- `getSourceActor`
- `querySourceActorsById`: maps `string[]` -> `SourceActor[]`
- `querySourcesByThreadID`: retrieves `Record<ThreadName, SourceActor[]>`
- `getSourceActorsForThread`: concatenates array of sources for thread IDs
- `queryThreadsBySourceObject`: calculates `Record<SourceName, ThreadName[]>`
- `getAllThreadsBySource`
- `getSourceActorBreakpointHitCounts`
- `getSourceActorBreakableLines`
- `getSourceActorBreakpointColumns`
- `getBreakableLinesForSourceActors`
