import React from "react";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className">
>(function TextInput(props, ref) {
  return (
    <input
      {...props}
      ref={ref}
      type="text"
      className="focus:ring-primaryAccent focus:primaryAccentHover block w-full text-lg border px-3 py-2 border-textFieldBorder rounded-md"
    />
  );
});
