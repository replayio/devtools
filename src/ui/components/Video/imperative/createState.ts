export type Listener<Type> = (value: Type, prevValue: Type) => void;

export interface State<Type> {
  listen: (callback: Listener<Type>) => () => void;
  read: () => Type;
  update: (nextValue: Type) => Type;
}

export function createState<Type>(defaultValue: Type): State<Type> {
  let currentValue = defaultValue;
  let prevValue = currentValue;

  const listeners: Set<Listener<Type>> = new Set();

  function listen(callback: Listener<Type>) {
    listeners.add(callback);

    try {
      return () => {
        listeners.delete(callback);
      };
    } finally {
      callback(currentValue, prevValue);
    }
  }

  function read() {
    return currentValue;
  }

  function update(nextValue: Type) {
    if (currentValue === nextValue) {
      return currentValue;
    }

    prevValue = currentValue;
    currentValue = nextValue;

    listeners.forEach(callback => {
      callback(nextValue, prevValue);
    });

    return nextValue;
  }

  return {
    listen,
    read,
    update,
  };
}
