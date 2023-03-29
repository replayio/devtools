import { Recording } from "shared/graphql/types";

export function getDuration(recordings: Recording[]) {
  return recordings
    .flatMap(r => r.metadata?.test?.tests?.map(t => t.duration))
    .reduce<number>((acc, v) => acc + (v || 0), 0);
}
