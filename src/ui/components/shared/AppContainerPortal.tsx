import { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function AppContainerPortal({ children }: { children: ReactNode }) {
  const containerNode = document.querySelector("#app-container")!;
  return createPortal(children, containerNode);
}
