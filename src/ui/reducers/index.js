import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import metadata, * as metadataSelectors from "./metadata";

export const reducers = {
  app,
  timeline,
  metadata,
};

export const selectors = { ...appSelectors, ...timelineSelectors, ...metadataSelectors };
