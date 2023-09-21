import { compareNumericStrings } from "protocol/utils";
import { insert } from "replay-next/src/utils/array";
import { createSingleEntryCacheWithTelemetry } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { Annotation } from "shared/graphql/types";

export const AnnotationsCache = createSingleEntryCacheWithTelemetry<
  [client: ReplayClientInterface],
  Annotation[]
>({
  debugLabel: "AnnotationsCache",
  load: async ([client]) => {
    const sortedAnnotations: Annotation[] = [];

    await client.findAnnotations("replay-cypress", annotation => {
      const processedAnnotation = {
        point: annotation.point,
        time: annotation.time,
        message: parseContents(annotation.contents),
      };

      insert(sortedAnnotations, processedAnnotation, (a, b) =>
        compareNumericStrings(a.point, b.point)
      );
    });

    return sortedAnnotations;
  },
});

export const PlaywrightAnnotationsCache = createSingleEntryCacheWithTelemetry<
  [client: ReplayClientInterface],
  Annotation[]
>({
  debugLabel: "PlaywrightAnnotationsCache",
  load: async ([client]) => {
    const sortedAnnotations: Annotation[] = [];

    await client.findAnnotations("replay-playwright", annotation => {
      const processedAnnotation = {
        point: annotation.point,
        time: annotation.time,
        message: JSON.parse(annotation.contents).message,
      };

      insert(sortedAnnotations, processedAnnotation, (a, b) =>
        compareNumericStrings(a.point, b.point)
      );
    });

    return sortedAnnotations;
  },
});

function parseContents(contents: string) {
  const parsed = JSON.parse(contents);

  // HACK These values have been stringified multiple times
  // HACK Cypress annotation format differs between Chromium and Gecko runners
  // TODO https://linear.app/replay/issue/SCS-256
  if (typeof parsed === "object") {
    return JSON.parse(JSON.parse(parsed.message));
  } else {
    return JSON.parse(JSON.parse(parsed));
  }
}
