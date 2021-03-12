import * as commentsHooks from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";
import * as settingsHooks from "./settings";

export default {
  ...commentsHooks,
  ...sessionHooks,
  ...recordingHooks,
  ...settingsHooks,
};
