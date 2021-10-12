import classNames from "classnames";
import React, { SetStateAction } from "react";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "md" | "lg" | "xl";
    center?: boolean;
  }
>(function TextInput(props, ref) {
  const { textSize, center } = props;

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      className={classNames(
        textSize === "xl" ? "text-2xl" : textSize === "lg" ? "text-base" : "text-sm",
        center ? "text-center" : "",
        "text-black focus:ring-primaryAccent focus:border-primaryAccent block w-full border px-2.5 py-1.5 border-textFieldBorder rounded-md"
      )}
    />
  );
});
