import shortUUID from "short-uuid";
import slugify from "slugify";

import { Recording } from "shared/graphql/types";

import { usesWindow } from "../../ssr";
import { SLUG_SEPARATOR, extractIdAndSlug } from "./helpers";

const WARNING_MS = 60 * 2 * 1000;
export const showDurationWarning = (recording: Recording) =>
  !!recording.duration && recording.duration > WARNING_MS;

export function getRecordingURL(recording: Recording): string {
  let id = recording.id;
  if (recording.title) {
    id = slugify(recording.title, { strict: true }).toLowerCase() + SLUG_SEPARATOR + recording.id;
  }

  return `/recording/${id}`;
}

export function getShortenedRecordingURL(recording: Recording): string {
  let id = recording.id;
  const translator = shortUUID();
  const shortId = translator.fromUUID(id);

  return `/r/${shortId}`;
}

export function getRecordingId(): string | undefined {
  return usesWindow(win => {
    if (!win) {
      return undefined;
    }

    const parts = window.location.pathname.split("/");
    if (parts[1] === "recording") {
      return extractIdAndSlug(parts.slice(2)).id;
    }

    return undefined;
  });
}
