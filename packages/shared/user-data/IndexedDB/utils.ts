import { IDBPDatabase, openDB } from "idb";
import { Cache, createCache } from "suspense";

import { IDBOptions } from "shared/user-data/IndexedDB/types";

export async function preloadIDBInitialValues(
  idbPrefsDatabase: IDBOptions[],
  recordingId?: string
) {
  const idbPrefsPromises: Promise<any>[] = [];
  if (!recordingId) {
    // We don't have a recording ID if it's the library
    return;
  }

  if (recordingId) {
    for (let dbOptions of idbPrefsDatabase) {
      for (let storeName of dbOptions.storeNames) {
        idbPrefsPromises.push(latestIndexedDbCache.readAsync(dbOptions, storeName, recordingId));
      }
    }
  }

  return Promise.all(idbPrefsPromises);
}

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

export const latestIndexedDbCache: Cache<
  [dbOptions: IDBOptions, storeName: string, recordName: string],
  any
> = createCache({
  debugLabel: "LatestIndexedDB",
  getKey: ([dbOptions, storeName, recordName]) =>
    dbOptions.databaseName + dbOptions.databaseVersion + storeName + recordName,
  load: async ([dbOptions, storeName, recordName]) => {
    const dbInstance = await indexedDbCache.readAsync(dbOptions);
    return dbInstance.get(storeName, recordName);
  },
});
