export function deselect(htmlElement: HTMLElement) {
  switch (htmlElement.tagName) {
    case "INPUT":
    case "TEXTAREA":
      break;
    default:
      if (typeof window !== "undefined" && typeof window.getSelection === "function") {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }
      break;
  }
}

export async function selectAll(htmlElement: HTMLElement) {
  switch (htmlElement.tagName) {
    case "INPUT":
      (htmlElement as HTMLInputElement).select();
      break;
    case "TEXTAREA":
      (htmlElement as HTMLTextAreaElement).select();
      break;
    default:
      htmlElement.focus();

      // HACK
      // Waiting until the end of the microtask queue works around a selection bug in Safari.
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve();

          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(htmlElement);

            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 0)
      );
      break;
  }
}
