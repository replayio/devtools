import { Recording } from "shared/graphql/types";

export function getDuration(recordings: Recording[]) {
  return recordings.reduce<number>(
    (accumulated, recording) => accumulated + (recording.metadata?.test?.approximateDuration ?? 0),
    0
  );
}
