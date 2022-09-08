/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React from "react";
import { setSelectedPrimaryPanel, toggleCommandPalette } from "ui/actions/layout";
import { useAppDispatch } from "ui/setup/hooks";
import { toggleQuickOpen } from "../actions/quick-open";

export default function WelcomeBox() {

  const dispatch = useAppDispatch();
  const openCommandPalette = () => {
    dispatch(toggleCommandPalette());
  };
  const openQuickOpen = () => {
    dispatch(toggleQuickOpen());
  };
  const openFullTextSearch = () => {
    dispatch(setSelectedPrimaryPanel("search"));
  };

  return (
    <div className="flex flex-col items-center w-full h-full overflow-hidden">
      <div className="relative flex justify-center w-full h-full px-8 pt-24">
        <div className="relative flex flex-col items-center w-full h-full text-sm">
          
          <div className="flex flex-col w-full space-y-1 text-bodyColor">            
            <div className="flex flex-row space-x-4 hover:text-black hover:cursor-pointer group" onClick={openCommandPalette}>
              <div className="w-full pt-1 text-right">Command palette</div>
              <div className="flex flex-row w-full"><img src="/images/command.svg" /> <img src="/images/k.svg" /></div>
            </div>
            <div className="flex flex-row space-x-4 hover:text-black hover:cursor-pointer group" onClick={openQuickOpen}>
              <div className="w-full pt-1 text-right">Go to file</div>
              <div className="flex flex-row w-full"><img src="/images/command.svg" /> <img src="/images/p.svg" /></div>
            </div>
            <div className="flex flex-row space-x-4 hover:text-black hover:cursor-pointer group" onClick={openFullTextSearch}>
              <div className="w-full pt-1 text-right">Find in file</div>
              <div className="flex flex-row w-full"><img src="/images/command.svg" /> <img src="/images/shift.svg" /> <img src="/images/f.svg" /></div>
            </div>        
          </div>

          <div className="absolute flex flex-row w-full bottom-16">
            <div className="left-0 w-full hover:underline"><a href="https://docs.replay.io">Docs</a></div>
            <div className="text-right hover:underline"><a href="https://replay.io/discord">Discord</a></div>
          </div>


        </div>
      </div>
    </div>
  );
}
