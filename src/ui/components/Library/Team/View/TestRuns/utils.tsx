import { Recording } from "ui/types";

export function getDuration(recordings: Recording[]) {
  return recordings
    .flatMap(r => r.metadata?.test?.tests?.map(t => t.duration))
    .reduce<number>((acc, v) => acc + (v || 0), 0);
}
export const getDurationString = (duration: number) => {
  const date = new Date(duration);
  const minutes = date.getMinutes() + "";
  const seconds = date.getSeconds() + "";

  return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
};
