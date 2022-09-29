import { PlaywrightTestArgs } from "@playwright/test";
import { LocatorFixtures as TestingLibraryFixtures } from "@playwright-testing-library/test/fixture";

export type TestArgs = PlaywrightTestArgs & TestingLibraryFixtures;
export type Screen = TestArgs["screen"];
export type Within = TestArgs["within"];

export type Expected = string | boolean | number;

// TODO Would be nice to share this type with the production Console renderers
export type MessageType =
  | "console-error"
  | "console-log"
  | "console-warning"
  | "event"
  | "exception"
  | "log-point"
  | "terminal-expression";
