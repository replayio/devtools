// This is the DOM node used to display a video in the UI.
// We store it as a separate variable here, so that `<Video>` can
// use a React ref to save the DOM node as it renders, and then
// `graphics.ts` can access that DOM node to call `stop()/start()`,
// without having the two files directly interact with each other.
let videoNode: HTMLVideoElement | null;

export const setVideoNode = (node: HTMLVideoElement | null) => {
  videoNode = node;
};

export const getVideoNode = () => {
  return videoNode;
};
