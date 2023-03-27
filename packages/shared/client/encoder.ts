function reviver(_: string, value: any) {
  if (typeof value === "object" && value !== null) {
    switch (value.dataType) {
      case "Map":
        return new Map(value.value);
      case "Set":
        return new Set(value.value);
      case "Error":
        const error = new Error(value.message);
        error.name = value.name;
        (error as any).code = value.code;
        return error;
    }
  }
  return value;
}

function replacer(_: string, value: any): any {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: [...value],
    };
  } else if (value instanceof Set) {
    return {
      dataType: "Set",
      value: [...value],
    };
  } else if (value instanceof Error) {
    return {
      dataType: "Error",
      value: {
        name: value.name,
        message: value.message,
        code: (value as any).code,
      },
    };
  } else {
    return value;
  }
}

export function decode(string: string): any {
  return JSON.parse(string, reviver);
}

export function encode(data: any): string {
  return JSON.stringify(data, replacer, 2);
}
