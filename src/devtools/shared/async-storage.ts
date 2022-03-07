/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *
 * Adapted from https://github.com/mozilla-b2g/gaia/blob/f09993563fb5fec4393eb71816ce76cb00463190/shared/js/async_storage.js
 * (converted to use Promises instead of callbacks).
 *
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database.  It creates a global asyncStorage object that has
 * methods like the localStorage object.
 *
 * To store a value use setItem:
 *
 *   asyncStorage.setItem("key", "value");
 *
 * This returns a promise in case you want confirmation that the value has been stored.
 *
 *  asyncStorage.setItem("key", "newvalue").then(function() {
 *    console.log("new value stored");
 *  });
 *
 * To read a value, call getItem(), but note that you must wait for a promise
 * resolution for the value to be retrieved.
 *
 *  asyncStorage.getItem("key").then(function(value) {
 *    console.log("The value of key is:", value);
 *  });
 *
 * Note that unlike localStorage, asyncStorage does not allow you to store and
 * retrieve values by setting and querying properties directly. You cannot just
 * write asyncStorage.key; you have to explicitly call setItem() or getItem().
 *
 * removeItem(), clear(), length(), and key() are like the same-named methods of
 * localStorage, and all return a promise.
 *
 * The asynchronous nature of getItem() makes it tricky to retrieve multiple
 * values. But unlike localStorage, asyncStorage does not require the values you
 * store to be strings.  So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 *
 */

const DBNAME = "devtools-async-storage";
const DBVERSION = 1;
const STORENAME = "keyvaluepairs";

const withStore = (
  type: IDBTransactionMode,
  onsuccess: (store: IDBObjectStore, db: IDBDatabase) => void,
  onerror: () => void
) => {
  const dbConn = indexedDB.open(DBNAME, DBVERSION);

  dbConn.onerror = () => {
    onerror();
  };

  dbConn.onupgradeneeded = () => {
    // First time setup: create an empty object store
    dbConn.result.createObjectStore(STORENAME);
  };

  dbConn.onsuccess = () => {
    const db = dbConn.result;
    const transaction = db.transaction(STORENAME, type);
    const store = transaction.objectStore(STORENAME);
    onsuccess(store, db);
  };
};

export const getItem = (itemKey: string) => {
  return new Promise((resolve, reject) => {
    withStore(
      "readonly",
      (store, db) => {
        store.transaction.oncomplete = () => {
          let value = req.result;
          if (value === undefined) {
            value = null;
          }
          db.close();
          resolve(value);
        };
        const req = store.get(itemKey);
        req.onerror = () => {
          console.error("Error in asyncStorage.getItem():", req.error?.name);
          reject(req.error);
        };
      },
      reject
    );
  });
};

export const setItem = (itemKey: string, value: any) => {
  return new Promise((resolve, reject) => {
    withStore(
      "readwrite",
      (store, db) => {
        store.transaction.oncomplete = resolve;
        const req = store.put(value, itemKey);
        req.onerror = () => {
          console.error("Error in asyncStorage.setItem():", req.error?.name);
          reject(req.error);
        };
        db.close();
      },
      reject
    );
  });
};
