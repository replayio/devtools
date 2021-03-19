import * as commentsHooks from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";
import * as settingsHooks from "./settings";
import * as collaboratorsHooks from "./collaborators";
import * as workspacesHooks from "./workspaces";

export default {
  ...commentsHooks,
  ...sessionHooks,
  ...recordingHooks,
  ...settingsHooks,
  ...collaboratorsHooks,
  ...workspacesHooks,
};
