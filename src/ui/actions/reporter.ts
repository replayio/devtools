import { Annotation } from "@replayio/protocol";
import debounce from "lodash/debounce";

import type { ThreadFront as TF } from "protocol/thread";
import { addReporterAnnotations, completeReporterAnnotations } from "ui/reducers/reporter";

import { UIStore } from ".";

function parseContents(contents: string) {
  let parsed = JSON.parse(contents);

  // We need to handle this differently based on the browser until
  // we start sending the same payload down for Cypress annotations
  // https://linear.app/replay/issue/SCS-256/cypress-annotations-payload-is-different-between-firefox-and-chromium
  if (typeof parsed === "object") {
    return JSON.parse(parsed.message);
  } else {
    return JSON.parse(parsed);
  }
}

export async function setupReporter(store: UIStore, ThreadFront: typeof TF) {
  const kind = "replay-cypress";
  await ThreadFront.ensureAllSources();

  // Annotations come in piecemeal over time. Cut down the number of dispatches by
  // storing incoming Annotations and debouncing the dispatch considerably.
  let receivedAnnotations: Annotation[] = [];

  // Debounce loading of annotations
  const onAnnotationsReceived = debounce(() => {
    const filtered = receivedAnnotations.filter(a => a.kind === kind);
    store.dispatch(
      addReporterAnnotations(
        filtered.map(({ point, time, contents }) => ({
          point,
          time,
          message: JSON.parse(parseContents(contents)),
        }))
      )
    );
    receivedAnnotations = [];
  }, 1000);

  ThreadFront.getAnnotations(annotations => {
    receivedAnnotations.push(...annotations);
    onAnnotationsReceived();
  }, kind).then(r => {
    store.dispatch(completeReporterAnnotations());
  });
}
