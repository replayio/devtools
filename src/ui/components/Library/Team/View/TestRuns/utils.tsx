import { Recording } from "shared/graphql/types";

export function getDuration(recordings: Recording[]) {
  return (
    recordings
      // @ts-ignore TODO [FE-1419] Remove this once recording.metadata.test is typed again
      .flatMap(r => r.metadata?.test?.tests?.map(test => test.duration))
      .reduce<number>((acc, v) => acc + (v || 0), 0)
  );
}
