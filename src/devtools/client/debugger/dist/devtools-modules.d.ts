export type AsyncStoreMappings<K extends string> = Record<K, string | [string, any]>;

export function asyncStoreHelper<K extends string>(root: string, mappings: AsyncStoreMappings<K>): Record<K, any>;
