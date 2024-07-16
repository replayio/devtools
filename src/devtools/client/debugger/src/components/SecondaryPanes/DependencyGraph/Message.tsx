import { PropsWithChildren } from "react";

export function Message({ children }: PropsWithChildren) {
  return <div className="w-full py-2 text-center italic">{children}</div>;
}
