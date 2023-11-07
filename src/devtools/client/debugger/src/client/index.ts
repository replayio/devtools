/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import type { UIStore } from "ui/actions";
import { allSourcesReceived } from "ui/reducers/sources";

export async function bootstrap(store: UIStore, replayClient: ReplayClientInterface) {
  const sources = await sourcesCache.readAsync(replayClient);

  store.dispatch(allSourcesReceived(sources));
}
