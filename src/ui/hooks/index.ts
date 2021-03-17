import * as commentsHooks from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";
import * as settingsHooks from "./settings";
import * as collaboratorsHooks from "./collaborators";

export default {
  ...commentsHooks,
  ...sessionHooks,
  ...recordingHooks,
  ...settingsHooks,
  ...collaboratorsHooks,
};
