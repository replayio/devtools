import formatDistanceToNow from "date-fns/formatDistanceToNow";
import padStart from "lodash/padStart";
import prettyMilliseconds from "pretty-ms";

export function formatDuration(ms: number, digits = 1) {
  return prettyMilliseconds(ms, { millisecondsDecimalDigits: digits });
}

export function formatTimestamp(ms: number) {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
}

export function getDurationString(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number") {
    return "";
  }

  return formatDuration(durationMs);
}

function shortenRelativeDate(date: string) {
  return date
    .replace("about", "")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace("less than am", "1m");
}

export function getRelativeDate(date: string) {
  let content = shortenRelativeDate(
    formatDistanceToNow(new Date(date), { addSuffix: true })
  );

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  let formatter;
  try {
    // Attempt to get the user's preferred language from the browser
    const userLocale = navigator.language;
    formatter = new Intl.DateTimeFormat(userLocale, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch (e) {
    // Use the default US format if we can't determine the user's preferred language
    formatter = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  }

  // Show relative time if under 2 weeks, otherwise, use the template below.
  if (daysSince > 14) {
    content = formatter.format(new Date(date));
  }

  return content;
}
