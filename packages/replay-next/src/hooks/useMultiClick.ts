import { MouseEvent, useRef } from "react";

const DEFAULT_INTERVAL = 100;

export function useMultiClick<ElementType>({
  interval = DEFAULT_INTERVAL,
  onDoubleClick,
  onSingleClick,
  onTripleClick,
}: {
  interval?: number;
  onDoubleClick?: (event: MouseEvent<ElementType>) => void;
  onSingleClick?: (event: MouseEvent<ElementType>) => void;
  onTripleClick?: (event: MouseEvent<ElementType>) => void;
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onClick = (event: MouseEvent<ElementType>) => {
    event.persist();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;

      switch (event.detail) {
        case 1:
          onSingleClick?.(event);
          break;
        case 2:
          onDoubleClick?.(event);
          break;
        case 3:
          onTripleClick?.(event);
          break;
      }
    }, interval);
  };

  return {
    onClick,
  };
}
