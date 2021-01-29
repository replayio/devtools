import React from "react";
import { createPortal } from "react-dom";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";

export default function EditorLoadingBar() {
  const portalNode = document.querySelector(".CodeMirror-sizer");
  if (!portalNode) {
    return null;
  }

  return createPortal(<LoadingProgressBar initialProgress={Math.random() * 10} />, portalNode);
}
