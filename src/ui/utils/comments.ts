import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInMonths from "date-fns/differenceInMonths";
import differenceInWeeks from "date-fns/differenceInWeeks";
import differenceInYears from "date-fns/differenceInYears";

export function formatRelativeTime(date: Date) {
  const minutes = differenceInMinutes(Date.now(), date);
  const days = differenceInCalendarDays(Date.now(), date);
  const weeks = differenceInWeeks(Date.now(), date);
  const months = differenceInMonths(Date.now(), date);
  const years = differenceInYears(Date.now(), date);

  if (years > 0) {
    return `${years}y`;
  }
  if (months > 0) {
    return `${months}mo`;
  }
  if (weeks > 0) {
    return `${weeks}w`;
  }
  if (days > 0) {
    return `${days}d`;
  }
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "Now";
}

export function isCommentContentEmpty(content: string | object): boolean {
  if (typeof content === "string") {
    return content.trim() === "";
  } else {
    return !(content as any)?.content?.find((paragraph: any) =>
      paragraph.content.find((block: any) => {
        return block.text.trim() !== "";
      })
    );
  }
}

export function parseCommentContent(content: string | object): Object {
  if (typeof content === "object") {
    return content;
  }

  try {
    return JSON.parse(content) as any;
  } catch {
    // Our comments were not always JSON; they used to be stored as markdown.
    // In that case, we just render the raw markdown.
    const textContent = content ? [{ type: "text", text: content }] : [];
    return {
      type: "doc",
      content: [{ type: "paragraph", content: textContent }],
    };
  }
}
