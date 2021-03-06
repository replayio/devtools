import * as commentsHooks from "./comments";
import * as sessionHooks from "./sessions";
import * as recordingHooks from "./recordings";

export default {
  ...commentsHooks,
  ...sessionHooks,
  ...recordingHooks,
};
