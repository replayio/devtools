import { Recording } from "ui/types";

export function getDuration(recordings: Recording[]) {
  console.log({ time: recordings.map(r => new Date(r.date).toTimeString()) });
  const sortedRecordings = recordings.map(r => new Date(r.date).getTime()).sort((a, b) => a - b);
  return sortedRecordings[sortedRecordings.length - 1] - sortedRecordings[0];
}
export const getDurationString = (duration: number) => {
  const date = new Date(duration);
  const minutes = date.getMinutes() + "";
  const seconds = date.getSeconds() + "";

  return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
};
