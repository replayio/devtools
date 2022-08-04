export type Entry = {
  args: any[] | null;
  isAsync: boolean;
  isGetter: boolean;
  method: string;
  result: any;
  thennable: any | null;
};
