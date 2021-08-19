import classNames from "classnames";
import React from "react";

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
        textSize === "xl" ? "text-4xl" : textSize === "lg" ? "text-2xl" : "text-lg",
        center ? "text-center" : "",
        "focus:ring-primaryAccent focus:primaryAccentHover block w-full border px-3 py-2 border-textFieldBorder rounded-md"
      )}
    />
  );
});
