/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { useState } from "react";

export default function A11yIntention({ children }: { children: React.ReactNode }) {
  const [isKeyboard, setIsKeyboard] = useState(false);

  const handleKeyDown = () => setIsKeyboard(true);

  const handleMouseDown = () => setIsKeyboard(false);

  return (
    <div
      className={isKeyboard ? "A11y-keyboard" : "A11y-mouse"}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}
