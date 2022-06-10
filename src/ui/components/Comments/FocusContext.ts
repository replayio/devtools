import React from "react";

export const FocusContext = React.createContext({
  autofocus: false,
  isFocused: false,
  blur: () => {},
  close: () => {},
});
