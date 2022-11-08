type Record<T> = {
  value: T | undefined;
};

function getOrCreateObjectStore(database: IDBDatabase, storeName: string): IDBObjectStore {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "key" });
  }

  const transaction = database.transaction([storeName]);
  return transaction.objectStore(storeName);
}

async function getRecord<T>(
  database: IDBDatabase,
  storeName: string,
  recordName: string
): Promise<
  | {
      error: Error;
      record: null;
    }
  | {
      error: null;
      record: Record<T | undefined>;
    }
> {
  return new Promise<
    | {
        error: Error;
        record: null;
      }
    | {
        error: null;
        record: Record<T | undefined>;
      }
  >(resolve => {
    const objectStore = getOrCreateObjectStore(database, storeName);
    const readRequest = objectStore.get(recordName);
    readRequest.onerror = () => {
      console.error("IndexedDB read error:", readRequest.error);
      resolve({
        error: readRequest.error!,
        record: null,
      });
    };
    readRequest.onsuccess = () => {
      resolve({
        error: null,
        record: readRequest.result as Record<T>,
      });
    };
  });
}

export async function getValue<T>(
  database: IDBDatabase,
  storeName: string,
  recordName: string
): Promise<
  | {
      error: Error;
      value: null;
    }
  | {
      error: null;
      value: T | undefined;
    }
> {
  const { error, record } = await getRecord<T>(database, storeName, recordName);
  if (error !== null) {
    return {
      error,
      value: null,
    };
  } else {
    return {
      error: null,
      value: record.value || undefined,
    };
  }
}

export async function setValue<T>(
  database: IDBDatabase,
  storeName: string,
  recordName: string,
  value: T
): Promise<void> {
  const { error, record } = await getRecord<T>(database, storeName, recordName);
  if (error !== null) {
    throw error;
  }

  record!.value = value;

  await new Promise<void>((resolve, reject) => {
    const objectStore = getOrCreateObjectStore(database, storeName);
    const writeRequest = objectStore.put(record);
    writeRequest.onerror = () => {
      console.error("IndexedDB write error:", writeRequest.error);
      reject(writeRequest.error);
    };
    writeRequest.onsuccess = () => {
      resolve();
    };
  });
}
