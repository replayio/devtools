import groupBy from 'lodash/groupBy';

/**
 * Takes an array of [Key, Value | Value[]] entries, and groups them by key.
 * @return A new entry array, where values of the same key are merged into one entry.
 */
export function groupEntries<K, V>(entries: [K, V | V[]][]): [K, V[]][] {
  return Object.values(
    groupBy(entries, x => x[0]))
    .map(group => [group[0][0], group.flatMap(([k, v]) => v)]);
}
