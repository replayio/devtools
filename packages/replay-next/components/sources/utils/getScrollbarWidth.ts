let cachedScrollbarWidth: number | undefined = undefined;

export default function getScrollbarWidth(): number {
  if (cachedScrollbarWidth === undefined) {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.style.overflow = "scroll";

      document.body.appendChild(div);

      const scrollBarWidth = div.offsetWidth - div.clientWidth;
      document.body.removeChild(div);

      cachedScrollbarWidth = scrollBarWidth;
    }
  }

  return cachedScrollbarWidth ?? 0;
}
