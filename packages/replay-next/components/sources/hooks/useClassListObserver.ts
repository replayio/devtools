import { useLayoutEffect, useRef } from "react";

type Callback = (classList: DOMTokenList) => void;

export default function useClassListObserver(htmlElement: HTMLElement, callback: Callback): void {
  const callbackRef = useRef<Callback>(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useLayoutEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const callback = callbackRef.current;
          callback(htmlElement.classList);
        }
      });
    });
    observer.observe(htmlElement, { attributes: true });

    const callback = callbackRef.current;
    callback(htmlElement.classList);

    return () => {
      observer.disconnect();
    };
  }, [htmlElement]);
}
