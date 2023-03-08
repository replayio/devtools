import classNames from "classnames";
import React from "react";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "base" | "lg" | "2xl";
    center?: boolean;
    className?: string;
  }
>(function TextInput(props, ref) {
  const { textSize, center } = props;

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      className={classNames(
        `text-${textSize ? textSize : "sm"}`,
        center ? "text-center" : "",
        "block w-full rounded-md border border-transparent border-inputBorder bg-themeTextFieldBgcolor p-2 text-themeTextFieldColor hover:bg-themeTextFieldBgcolorHover focus:border-primaryAccent focus:ring-primaryAccent",
        props.className
      )}
    />
  );
});
