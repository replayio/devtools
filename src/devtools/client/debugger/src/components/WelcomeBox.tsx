/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
import CommandPalette from "ui/components/CommandPalette";

export default function WelcomeBox() {
  return (
    <div className="flex flex-col items-center w-full h-full overflow-hidden">
      <div className="relative flex justify-center w-full h-full px-8 pt-24">
        <div className="relative flex flex-col items-center w-full h-full text-sm">
          

        
          <div className="flex flex-row space-x-4">
            
            <div>
              <div className="pb-3 text-right">Command palette</div>
              <div className="pb-3 text-right">Go to file</div>
              <div className="pb-3 text-right">Find in file</div>
            </div>

            <div>
              <div className="flex flex-row pb-1.5"><img src="/images/command.svg" /> <img src="/images/k.svg" /></div>
              <div className="flex flex-row pb-1.5"><img src="/images/command.svg" /> <img src="/images/p.svg" /></div>
              <div className="flex flex-row pb-1.5"><img src="/images/command.svg" /> <img src="/images/shift.svg" /> <img src="/images/f.svg" /></div>
            </div>

          </div>

          <hr />
          
          <div className="absolute flex flex-row w-full bottom-16">
            <div className="left-0 w-full hover:underline"><a href="https://docs.replay.io">Docs</a></div>
            <div className="text-right hover:underline"><a href="https://replay.io/discord">Discord</a></div>
          </div>


        </div>
      </div>
    </div>
  );
}
