/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
import CommandPalette from "ui/components/CommandPalette";

export default function WelcomeBox() {
  return (
    <div className="flex h-full w-full flex-col items-center overflow-hidden">
      <div className="relative flex h-full w-full justify-center px-8 pt-14">
        <div className="relative flex h-full w-full flex-col items-center">
          <CommandPalette />
        </div>
      </div>
    </div>
  );
}
