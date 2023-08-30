/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";

import { useAppSelector } from "ui/setup/hooks";

import { BoxModel } from "../../boxmodel/components/BoxModel";

function LayoutApp() {
  const boxModel = useAppSelector(state => state.boxModel);

  return (
    <div className="layout-container">
      <div className="h-full overflow-y-auto">
        <BoxModel boxModel={boxModel} />
      </div>
    </div>
  );
}

export default React.memo(LayoutApp);
