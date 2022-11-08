import { Action } from "@reduxjs/toolkit";
import { Annotation } from "@replayio/protocol";
import debounce from "lodash/debounce";

import type { ThreadFront as TF } from "protocol/thread";
import { Annotation as ParsedAnnotation } from "ui/state/reactDevTools";

import { UIStore } from ".";

export type AddAnnotationsAction = Action<"add_reporter_annotations"> & { annotations: ParsedAnnotation[] };

export type ReporterAction =
  | AddAnnotationsAction

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
      addAnnotations(
        filtered.map(({ point, time, contents }) => ({
          point,
          time,
          message: JSON.parse(JSON.parse(contents)),
        }))
      )
    );
    receivedAnnotations = [];
  }, 1_000);

  ThreadFront.getAnnotations(annotations => {
    receivedAnnotations.push(...annotations);
    onAnnotationsReceived();
  }, kind);
}

export function addAnnotations(annotations: ParsedAnnotation[]): AddAnnotationsAction {
  return { type: "add_reporter_annotations", annotations };
}
