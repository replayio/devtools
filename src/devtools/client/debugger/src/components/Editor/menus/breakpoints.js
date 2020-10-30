/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import actions from "../../../actions";
import { bindActionCreators } from "redux";

export const breakpointItems = () => {};

export function breakpointItemActions(dispatch) {
  return bindActionCreators(
    {
      addBreakpoint: actions.addBreakpoint,
      removeBreakpoint: actions.removeBreakpoint,
      removeBreakpointsAtLine: actions.removeBreakpointsAtLine,
      enableBreakpointsAtLine: actions.enableBreakpointsAtLine,
      disableBreakpointsAtLine: actions.disableBreakpointsAtLine,
      disableBreakpoint: actions.disableBreakpoint,
      toggleDisabledBreakpoint: actions.toggleDisabledBreakpoint,
      toggleBreakpointsAtLine: actions.toggleBreakpointsAtLine,
      setBreakpointOptions: actions.setBreakpointOptions,
      openConditionalPanel: actions.openConditionalPanel,
    },
    dispatch
  );
}
