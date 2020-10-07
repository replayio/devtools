import React from "react";
import classnames from "classnames";
import "./Modal.css";

export default function Modal({ children, opaque, translucent, error, noBackground }) {
  return (
    <div className={classnames("modal-container", { opaque, translucent, error })}>
      <div className={classnames("modal", { "no-bg": noBackground })}>{children}</div>
    </div>
  );
}
