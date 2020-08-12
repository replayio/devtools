import * as appActions from "./app";
import * as timelineActions from "./timeline";
import * as metadataActions from "./metadata";

export const actions = { ...appActions, ...timelineActions, ...metadataActions };
