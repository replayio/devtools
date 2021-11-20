export function isVisible(parent: HTMLElement, child: HTMLElement) {
  const { top, bottom } = child.getBoundingClientRect();
  const scrolledParentRect = parent.getBoundingClientRect();
  return top >= scrolledParentRect.top && bottom <= scrolledParentRect.bottom;
}
