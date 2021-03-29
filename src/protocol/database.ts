// Routines for performing and caching database queries.
// These emulate comparable Apollo Client methods.

import { sendMessage } from "./socket";

interface QueryStatus {
  loading: boolean;
  data: any;
  error: any;
};
const gDatabaseQueries: Map<string, Map<string, QueryStatus>> = new Map();

// Initiate or return the status of an existing database query with the given
// command name and parameters.
export function databaseQuery(method: string, params: any) {
  if (!gDatabaseQueries.has(method)) {
    gDatabaseQueries.set(method, new Map());
  }
  const map: any = gDatabaseQueries.get(method);
  const key = JSON.stringify(params);
  let value: any = map.get(key);
  if (!value) {
    value = { loading: true, data: null, error: null };
    map.set(key, value);
    const newMethod: any = `Database.${method}`;
    sendMessage(newMethod, params).then(
      data => {
        value.data = data;
        value.loading = false;
      },
      error => {
        value.error = error;
        value.loading = false;
      }
    );
  }
  return value;
}

export function invalidateDatabaseQueries(method: string) {
  gDatabaseQueries.delete(method);
}
