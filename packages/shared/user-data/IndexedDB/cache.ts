import { IDBPDatabase, openDB } from "idb";
import { Cache, createCache } from "suspense";

import { IDBOptions } from "shared/user-data/IndexedDB/types";

export const indexedDbCache: Cache<[dbOptions: IDBOptions], IDBPDatabase> = createCache({
  debugLabel: "IndexedDB",
  getKey: ([dbOptions]) => dbOptions.databaseName + dbOptions.databaseVersion,
  load: async ([dbOptions]) => {
    const { databaseName, databaseVersion, storeNames } = dbOptions;
    const dbInstance = await openDB(databaseName, databaseVersion, {
      upgrade(db) {
        // The callback runs both on initial creation (no DB yet) and on version number change.
        for (let storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        }
      },
    });
    return dbInstance;
  },
});
