import * as appActions from "./app";
import * as timelineActions from "./timeline";
import * as metadataActions from "./metadata";
import * as eventListeners from "devtools/client/debugger/src/actions/event-listeners";

import debuggerActions from "devtools/client/debugger/src/actions"

export const actions = { ...appActions, ...timelineActions, ...metadataActions, ...eventListeners, ...debuggerActions };
