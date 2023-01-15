import classNames from "classnames";
import React from "react";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "base" | "lg" | "2xl";
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
        `text-${textSize ? textSize : "sm"}`,
        center ? "text-center" : "",
        "block w-full rounded-md border border-themeBase-100 bg-[#F8F8F8] p-2 text-themeTextFieldColor hover:bg-[#F2F2F2] focus:border-primaryAccent focus:ring-primaryAccent"
      )}
    />
  );
});
