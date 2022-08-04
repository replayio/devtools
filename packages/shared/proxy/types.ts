export type Entry = {
  args: any[] | null;
  isAsync: boolean;
  isGetter: boolean;
  prop: string;
  result: any;
  thennable: any | null;
};
