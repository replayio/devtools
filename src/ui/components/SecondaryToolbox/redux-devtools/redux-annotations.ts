import { Annotation } from "@recordreplay/protocol";

let initialReceivedAnnotations: Annotation[] = [];

export let reduxAnnotationsReceived: (newAnnotations: Annotation[]) => void = newAnnotations => {
  initialReceivedAnnotations.push(...newAnnotations);
};

export const getInitialAnnotations = () => initialReceivedAnnotations;

export const setAnnotationsReceivedHandler = (newCallback: typeof reduxAnnotationsReceived) => {
  reduxAnnotationsReceived = newCallback;
};
