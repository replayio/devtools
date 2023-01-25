import "react";

declare module "react" {
  type TransitionCallback = () => void;

  // The following hooks are only available in the experimental react release.
  export function startTransition(TransitionCallback): void;
  export function useDeferredValue<T>(value: T): T;
  export function useTransition(): [
    isPending: boolean,
    startTransition: (TransitionCallback) => void
  ];

  // Unstable Suspense cache API
  export function unstable_getCacheForType<T>(resourceType: () => T): T;
  export function unstable_useCacheRefresh(): () => void;

  // Unstable Offscreen API
  export const unstable_Offscreen: ComponentClass<
    {
      children: ReactNode;
      mode: "hidden" | "visible";
    },
    any
  >;
}
