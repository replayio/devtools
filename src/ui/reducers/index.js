import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";

export const reducers = {
  app,
  timeline,
};

export const selectors = { ...appSelectors, ...timelineSelectors };
