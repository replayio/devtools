import { MappedLocation } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { UIStore } from "ui/actions";
import { getPreferredLocation as getPreferredLocationSelector } from "ui/reducers/sources";

// TODO [hbenl] some components ask for preferred locations in render functions or effects
// (so without direct access to the redux store), this is a temporary hack until these
// components are rewritten to use the sources selectors directly.

let store: UIStore;

export function getPreferredLocation(location: MappedLocation | undefined) {
  return location &&
  getPreferredLocationSelector(store.getState(), location, ThreadFront.preferredGeneratedSources);
}

export function setupGetPreferredLocation(_store: UIStore) {
  store = _store;
}
