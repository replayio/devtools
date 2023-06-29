// NOTE: If any change is made like adding a store name, bump the version number

import { IDBOptions } from "shared/user-data/IndexedDB/types";

// NOTE: If any change is made like adding a store name, bump the version number
// to ensure that the database is recreated properly.
export const CONSOLE_SETTINGS_DATABASE: IDBOptions = {
  databaseName: "ConsoleSettings",
  databaseVersion: 1,
  storeNames: ["filterToggles", "showExceptions", "terminalHistory"],
};

// to ensure that the database is recreated properly.
export const POINTS_DATABASE: IDBOptions = {
  databaseName: "Points",
  databaseVersion: 2,
  storeNames: [
    "points",
    "point-behaviors",
    // TODO [FE-1138] Remove this legacy table after a few weeks with the new Points storage format
    // See useLocalPoints() for more
    "high-priority",
  ],
};
