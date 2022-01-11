/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
import CommandPalette from "ui/components/CommandPalette";

export default function WelcomeBox() {
  return (
    <div className="flex flex-col items-center h-full w-full overflow-hidden">
      <div className="relative flex justify-center pt-14 px-8 w-full">
        <div className="absolute pointer-events-none">
          <img src="/images/bubble.svg" className="editor-bg" style={{ transform: "scale(2.4)" }} />
        </div>
        <div className="relative w-full flex flex-col items-center">
          <CommandPalette />
        </div>
      </div>
    </div>
  );
}
