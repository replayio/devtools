/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useContext } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppSelector } from "ui/setup/hooks";
import { layoutCache } from "ui/suspense/styleCaches";

import { BoxModel } from "../../boxmodel/components/BoxModel";
import { getSelectedNodeId } from "../../markup/selectors/markup";

function LayoutApp() {
  const replayClient = useContext(ReplayClientContext);
  const { pauseId } = useMostRecentLoadedPause() ?? {};
  const { selectedNodeId } = useAppSelector(
    state => ({
      selectedNodeId: getSelectedNodeId(state),
    }),
    shallowEqual
  );

  const { value: layout, status: nodeStatus } = useImperativeCacheValue(
    layoutCache,
    replayClient,
    pauseId,
    selectedNodeId
  );

  const content = nodeStatus === "resolved" && layout ? <BoxModel boxModel={{ layout }} /> : null;

  return (
    <div className="layout-container">
      <div className="h-full overflow-y-auto">{content}</div>
    </div>
  );
}

export default React.memo(LayoutApp);
