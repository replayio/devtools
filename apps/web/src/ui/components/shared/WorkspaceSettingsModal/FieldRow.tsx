import classNames from "classnames";
import React from "react";
import { Elements } from "@stripe/react-stripe-js";

export function FieldRow({ children, className, ...rest }: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        className,
        "grid grid-cols-3 gap-4 items-center border-t border-gray-200 pt-5"
      )}
    >
      {children}
    </div>
  );
}
