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
    <div className="flex h-full w-full flex-col items-center overflow-hidden bg-bodyBgcolor">
      <div className="relative flex h-full w-full max-w-md justify-center px-6 pt-20 sm:px-8 sm:pt-28">
        <div className="relative flex w-full flex-col items-stretch">
          <p className="mb-4 text-center text-sm text-muted-foreground">Keyboard shortcuts</p>
          <div className="rounded-xl border border-border/60 bg-card/80 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              className="group flex w-full cursor-pointer flex-row items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={openCommandPalette}
            >
              <span className="font-medium">Command palette</span>
              <span className="flex shrink-0 flex-row items-center gap-0.5 opacity-80 group-hover:opacity-100">
                <img alt="" src="/recording/images/command.svg" />{" "}
                <img alt="" src="/recording/images/k.svg" />
              </span>
            </button>
            <button
              type="button"
              className="group flex w-full cursor-pointer flex-row items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={openQuickOpen}
            >
              <span className="font-medium">Go to file</span>
              <span className="flex shrink-0 flex-row items-center gap-0.5 opacity-80 group-hover:opacity-100">
                <img alt="" src="/recording/images/command.svg" />{" "}
                <img alt="" src="/recording/images/p.svg" />
              </span>
            </button>
            <button
              type="button"
              className="group flex w-full cursor-pointer flex-row items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={openFullTextSearch}
            >
              <span className="font-medium">Find in file</span>
              <span className="flex shrink-0 flex-row items-center gap-0.5 opacity-80 group-hover:opacity-100">
                <img alt="" src="/recording/images/command.svg" />{" "}
                <img alt="" src="/recording/images/shift.svg" />{" "}
                <img alt="" src="/recording/images/f.svg" />
              </span>
            </button>
          </div>
          <div className="absolute bottom-12 flex w-full flex-row text-sm text-muted-foreground">
            <div className="w-full">
              <a
                href="https://docs.replay.io"
                className="rounded-md px-1 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Docs
              </a>
            </div>
            <div className="w-full text-right">
              <a
                href="https://replay.io/discord"
                className="rounded-md px-1 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
