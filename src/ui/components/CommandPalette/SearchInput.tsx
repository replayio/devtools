import classNames from "classnames";
import React, { FormEventHandler, KeyboardEventHandler } from "react";
import { TextInput } from "../shared/Forms";

// The classname's being used for focusing.
const CLASS = "command-palette-search";
export const getCommandPaletteInput = () =>
  document.querySelector(`.${CLASS} input`) as HTMLInputElement;

export default function SearchInput({
  value,
  onChange,
  onKeyDown,
  autoFocus,
}: {
  value: string;
  onChange: FormEventHandler;
  onKeyDown: KeyboardEventHandler;
  autoFocus: boolean;
}) {
  return (
    <div className={classNames(CLASS, "w-full")}>
      <TextInput
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        placeholder="What would you like to do?"
        textSize="lg"
      />
    </div>
  );
}
