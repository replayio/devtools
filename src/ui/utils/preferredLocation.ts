import { MappedLocation } from "@replayio/protocol";

import { ThreadFront } from "protocol/thread";
import { UIStore } from "ui/actions";
import {
  getCorrespondingSourceIds,
  getPreferredLocation as getPreferredLocationSelector,
} from "ui/reducers/sources";

// TODO [hbenl] some components ask for preferred locations in render functions or effects
// (so without direct access to the redux store), this is a temporary hack until these
// components are rewritten to use the sources selectors directly.

let store: UIStore;

export function getPreferredLocation(locations: MappedLocation | undefined) {
  if (!locations || locations.length === 0) {
    return;
  }
  const state = store.getState();
  // TODO [hbenl] another hack: the new console doesn't update sourceIds in locations
  // to their first corresponding sourceId, which getPreferredLocationSelector
  // subsequently complains about
  const correspondingLocations = locations.map(location => ({
    ...location,
    sourceId: getCorrespondingSourceIds(state, location.sourceId)[0],
  }));
  return getPreferredLocationSelector(state.sources, correspondingLocations);
}

export function setupGetPreferredLocation(_store: UIStore) {
  store = _store;
}
