export function formatDate(date: string, format: "relative" | "long" = "relative") {
  if ("RelativeTimeFormat" in Intl && format === "relative") {
    /* @ts-ignore */
    const rtf = new Intl.RelativeTimeFormat("en", {
      localeMatcher: "best fit",
      numeric: "auto",
      style: "long",
    });

    const ends = Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return rtf.format(ends, "day");
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(new Date(date)));
}
