export default function getScrollbarWidth(): number {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.style.overflow = "scroll";
    document.body.appendChild(div);
    const scrollBarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return scrollBarWidth;
  }

  return 0;
}
