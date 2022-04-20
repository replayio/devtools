import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import differenceInWeeks from "date-fns/differenceInWeeks";
import differenceInMonths from "date-fns/differenceInMonths";
import differenceInYears from "date-fns/differenceInYears";
import { Comment, Reply } from "ui/state/comments";
import compact from "lodash/compact";
import range from "lodash/range";
import sortBy from "lodash/sortBy";

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

function orderedByApproximatelyCreatedAt(comments: (Comment | Reply)[]): number[] {
  const indices = range(comments.length);
  const permutation = sortBy(indices, [i => Number(Date.parse(comments[i].createdAt))]);
  return indices.map(i => permutation.indexOf(i));
}

function commentIdentifiers(comment: Comment | Reply): string {
  return compact([
    comment.point,
    comment.sourceLocation?.sourceId,
    comment.sourceLocation?.line,
  ]).join("-");
}
