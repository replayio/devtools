/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import { ConnectedProps, connect } from "react-redux";

import Accordion from "devtools/client/shared/components/Accordion";
import Services from "devtools/shared/services";
import type { UIState } from "ui/state";

import { BoxModel } from "../../boxmodel/components/BoxModel";

const { prefs: prefsService } = Services;

const BOXMODEL_OPENED_PREF = "devtools.layout.boxmodel.opened";

const mapStateToProps = (state: UIState) => ({
  boxModel: state.boxModel,
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface LayoutAppProps {
  showBoxModelProperties: boolean;
}

type FinalLAProps = PropsFromRedux & LayoutAppProps;

class LayoutApp extends React.PureComponent<FinalLAProps> {
  getBoxModelSection() {
    return {
      component: BoxModel,
      componentProps: this.props,
      contentClassName: "layout-content",
      header: "Box Model",
      id: "layout-section-boxmodel",
      opened: prefsService.getBoolPref(BOXMODEL_OPENED_PREF),
      onToggle: (opened: boolean) => {
        prefsService.setBoolPref(BOXMODEL_OPENED_PREF, opened);
      },
    };
  }

  render() {
    const items = [this.getBoxModelSection()];

    return (
      <div className="layout-container">
        <div className="h-full overflow-y-auto">
          <Accordion items={items} style={{ overflow: "auto" }} />
        </div>
      </div>
    );
  }
}

export default connector(LayoutApp);
