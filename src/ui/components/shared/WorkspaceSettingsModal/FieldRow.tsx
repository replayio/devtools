import { Elements } from "@stripe/react-stripe-js";
import classNames from "classnames";
import React from "react";

export function FieldRow({ children, className, ...rest }: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        className,
        "grid grid-cols-3 items-center gap-4 border-t border-themeBase-90 pt-5"
      )}
    >
      {children}
    </div>
  );
}
