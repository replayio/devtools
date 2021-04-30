import React, { useState } from "react";
import Autocomplete from "./Autocomplete";

function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export default function WorkspaceForm() {
  const [inputValue, setInputValue] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    setInputValue(newValue);
    setIsValidEmail(validateEmail(newValue));
  };

  return (
    <div className="new-workspace-form">
      <div className="subheader">ADD MEMBER</div>
      <input
        type="textarea"
        placeholder="Search emails here"
        value={inputValue}
        onChange={onChange}
        onFocus={() => setTimeout(() => setIsFocused(true), 200)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />
      {isValidEmail && isFocused ? <Autocomplete inputValue={inputValue} /> : null}
    </div>
  );
}
