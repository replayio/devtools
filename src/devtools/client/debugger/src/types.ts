import { SourceLocation } from "@recordreplay/protocol";

export type ClassSymbol = {
  name: string;
  location: {
    start: SourceLocation;
    end: SourceLocation;
  };
};

export type FunctionSymbol = {
  name: string | null;
  klass: string | null;
  location: {
    start: SourceLocation;
    end: SourceLocation;
  };
  parameterNames: string[];
};

export type SourceSymbols = {
  classes: ClassSymbol[];
  functions: FunctionSymbol[];
  loading: boolean;
};

export type Source = {
  id: string;
  url: string;
};
