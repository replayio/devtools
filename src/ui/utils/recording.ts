import slugify from "slugify";
import { Recording } from "ui/types";
import { usesWindow } from "../../ssr";
import { extractIdAndSlug, SLUG_SEPARATOR } from "./helpers";

const WARNING_MS = 60 * 2 * 1000;
export const showDurationWarning = (recording: Recording) => recording.duration > WARNING_MS;

export function getRecordingURL(recording: Recording): string {
  let id = recording.id;
  if (recording.title) {
    id = slugify(recording.title, { strict: true }).toLowerCase() + SLUG_SEPARATOR + recording.id;
  }

  return `/recording/${id}`;
}

export function getRecordingId(): string | undefined {
  return usesWindow(win => {
    if (!win) return undefined;

    const parts = window.location.pathname.split("/");
    if (parts[1] === "recording") {
      return extractIdAndSlug(parts.slice(2)).id;
    }

    return undefined;
  });
}
