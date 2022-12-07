export function copyToClipboard(text: string): void {
  const doCopy = function (event: ClipboardEvent) {
    event.clipboardData?.setData("text/plain", text);
    event.preventDefault();
  };

  document.addEventListener("copy", doCopy);
  document.execCommand("copy", false);
  document.removeEventListener("copy", doCopy);
}
