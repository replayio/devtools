import { createSingleEntryCache } from "suspense";

import { ThreadFront } from "protocol/thread";
import { compareNumericStrings } from "protocol/utils";
import { insert } from "replay-next/src/utils/array";
import { Annotation } from "shared/graphql/types";

export const AnnotationsCache = createSingleEntryCache<[], Annotation[]>({
  debugLabel: "Annotations",
  load: async () => {
    await ThreadFront.ensureAllSources();

    const sortedAnnotations: Annotation[] = [];

    await ThreadFront.getAnnotations(partialAnnotations => {
      partialAnnotations.forEach(annotation => {
        const processedAnnotation = {
          point: annotation.point,
          time: annotation.time,
          message: parseContents(annotation.contents),
        };

        insert(sortedAnnotations, processedAnnotation, (a, b) =>
          compareNumericStrings(a.point, b.point)
        );
      });
    }, "replay-cypress");

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
