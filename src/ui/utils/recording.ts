import { Recording } from "ui/types";

const WARNING_MS = 60 * 2 * 1000;
export const showDurationWarning = (recording: Recording) => recording.duration > WARNING_MS;
