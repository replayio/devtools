export type ParamCall = [paramIndex: number, params: any];

export type Entry = {
  args: any[] | null;
  isAsync: boolean;
  isGetter: boolean;
  paramCalls?: ParamCall[];
  prop: string;
  result: any;
  thenable: any | null;
};
