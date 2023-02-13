import { IDBOptions } from "../../hooks/useIndexedDB";

// NOTE: If any change is made like adding a store name, bump the version number
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
