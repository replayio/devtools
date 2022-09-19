import createPlayer from "./createPlayer";
import createRecorder from "./createRecorder";
import { Entry } from "./types";

describe("proxy", () => {
  async function waitForPromisesToFlush() {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  function serialize(entries: Entry[]): Entry[] {
    return JSON.parse(JSON.stringify(entries));
  }

  test("should record and replay a series of requests", () => {
    class Target {
      divideByTwo(number: number) {
        return number / 2;
      }
      multiplyByTwo(number: number) {
        return number * 2;
      }
    }

    const onEntriesChanged = jest.fn();

    const [recorder, entries] = createRecorder(new Target(), { onEntriesChanged });
    recorder.multiplyByTwo(2);
    recorder.multiplyByTwo(3);
    recorder.divideByTwo(4);

    expect(entries).toHaveLength(3);
    expect(onEntriesChanged).toHaveBeenCalledTimes(3);

    const player = createPlayer<Target>(serialize(entries));

    // Any order should be supported.
    expect(player.divideByTwo(4)).toBe(2);
    expect(player.multiplyByTwo(2)).toBe(4);
    expect(player.multiplyByTwo(3)).toBe(6);

    // Multiple calls should be supported.
    expect(player.divideByTwo(4)).toBe(2);
    expect(player.divideByTwo(4)).toBe(2);

    console.error = jest.fn();

    // Unrecorded calls should throw.
    expect(() => player.divideByTwo(1)).toThrow();
    expect(() => player.multiplyByTwo(1)).toThrow();
    // @ts-ignore
    expect(() => player.notAMethod(1)).toThrow();

    expect(console.error).toHaveBeenCalledTimes(3);
  });

  test("should record and replay async responses", async () => {
    class Target {
      async multiplyByTwo(number: number) {
        return Promise.resolve(number * 2);
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    expect(await recorder.multiplyByTwo(2)).toBe(4);
    expect(await recorder.multiplyByTwo(3)).toBe(6);

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    expect(await player.multiplyByTwo(2)).toBe(4);
    expect(await player.multiplyByTwo(3)).toBe(6);
  });

  test("should resolve async responses correctly regardless of order", async () => {
    type Resolver = (value: any) => void;
    const resolvers: Resolver[] = [];
    class Target {
      async asyncMethod(...rest: any[]) {
        return new Promise(resolve => {
          resolvers.push(resolve);
        });
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    const a = recorder.asyncMethod();
    const b = recorder.asyncMethod();
    const c = recorder.asyncMethod();

    expect(resolvers).toHaveLength(3);
    expect(entries).toHaveLength(1);

    resolvers[2]("third");
    await waitForPromisesToFlush();
    resolvers[0]("first");
    await waitForPromisesToFlush();
    resolvers[1]("second");
    await waitForPromisesToFlush();

    expect(await a).toBe("first");
    expect(await b).toBe("second");
    expect(await c).toBe("third");

    const player = createPlayer<Target>(serialize(entries));
    // Only the most recent value should be returned.
    expect(await player.asyncMethod()).toBe("third");
  });

  test("should return the latest value for a method with multiple matching calls", async () => {
    class Target {
      async multiplyByTwo(number: number) {
        return Promise.resolve(number * 2);
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    expect(await recorder.multiplyByTwo(2)).toBe(4);
    expect(await recorder.multiplyByTwo(3)).toBe(6);

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    expect(await player.multiplyByTwo(2)).toBe(4);
    expect(await player.multiplyByTwo(3)).toBe(6);
  });

  test("should support getters", () => {
    class Target {
      get foo() {
        return 111;
      }
      get bar() {
        return 222;
      }
      getBaz() {
        return 333;
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    expect(recorder.foo).toBe(111);
    expect(recorder.bar).toBe(222);
    expect(recorder.getBaz()).toBe(333);

    expect(entries).toHaveLength(3);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.foo).toBe(111);
    expect(player.bar).toBe(222);
    expect(player.getBaz()).toBe(333);
  });

  test("should be able to evaluate and parse nested structures", () => {
    class Target {
      stringify(value: any) {
        return JSON.stringify(value);
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    expect(recorder.stringify([123, true, "abc"])).toBe('[123,true,"abc"]');
    expect(recorder.stringify({ foo: "abc", bar: 123, baz: { qux: true } })).toBe(
      '{"foo":"abc","bar":123,"baz":{"qux":true}}'
    );

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.stringify([123, true, "abc"])).toBe('[123,true,"abc"]');
    expect(player.stringify({ foo: "abc", bar: 123, baz: { qux: true } })).toBe(
      '{"foo":"abc","bar":123,"baz":{"qux":true}}'
    );
  });

  test("should properly handle undefined and null values", () => {
    class Target {
      process(value: any) {
        return value;
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    expect(recorder.process({ foo: undefined, bar: 123 })).toEqual({ foo: undefined, bar: 123 });
    expect(recorder.process({ foo: null, bar: 123 })).toEqual({ foo: null, bar: 123 });

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.process({ foo: undefined, bar: 123 })).toEqual({ foo: undefined, bar: 123 });
    expect(player.process({ foo: null, bar: 123 })).toEqual({ foo: null, bar: 123 });
  });

  test("should enable sanitizing args", () => {
    const SANITIZED_ARG = "sanitized";
    const object = { foo: 1, bar: 2, baz: 3 };
    const objectSanitizedArg = { ...object, bar: SANITIZED_ARG };

    class Target {
      process(value: any) {
        return value;
      }
    }
    const sanitizeArgs = jest.fn().mockImplementation((prop: string, args: any[] | null) => {
      expect(prop).toBe("process");
      expect(args).not.toBeNull();
      expect(args).toHaveLength(1);
      return [
        {
          ...args![0],
          bar: SANITIZED_ARG,
        },
      ];
    });

    const [recorder, entries] = createRecorder(new Target(), {
      sanitizeArgs,
    });
    expect(recorder.process(object)).toEqual(object);

    expect(entries).toHaveLength(1);
    expect(entries).toMatchInlineSnapshot(`
      Array [
        Object {
          "args": Array [
            Object {
              "bar": "sanitized",
              "baz": 3,
              "foo": 1,
            },
          ],
          "isAsync": false,
          "isGetter": false,
          "prop": "process",
          "result": Object {
            "bar": 2,
            "baz": 3,
            "foo": 1,
          },
          "thennable": null,
        },
      ]
    `);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.process(objectSanitizedArg)).toEqual(object);
  });

  test("should enable sanitizing results", () => {
    const SANITIZED_ARG = "sanitized";
    const object = { foo: 1, bar: 2, baz: 3 };
    const objectSanitizedResult = { ...object, baz: SANITIZED_ARG };

    class Target {
      process(value: any) {
        return value;
      }
    }
    const sanitizeResult = jest.fn().mockImplementation((prop: string, result: any) => {
      expect(prop).toBe("process");
      expect(result).not.toBeNull();
      return {
        ...result,
        baz: SANITIZED_ARG,
      };
    });

    const [recorder, entries] = createRecorder(new Target(), {
      sanitizeResult,
    });
    expect(recorder.process(object)).toEqual(objectSanitizedResult);

    expect(entries).toHaveLength(1);
    expect(entries).toMatchInlineSnapshot(`
      Array [
        Object {
          "args": Array [
            Object {
              "bar": 2,
              "baz": 3,
              "foo": 1,
            },
          ],
          "isAsync": false,
          "isGetter": false,
          "prop": "process",
          "result": Object {
            "bar": 2,
            "baz": "sanitized",
            "foo": 1,
          },
          "thennable": null,
        },
      ]
    `);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.process(object)).toEqual(objectSanitizedResult);
  });

  test("should enable sanitizing getter values", () => {
    const SANITIZED_ARG = "sanitized";
    const object = { foo: 1, bar: 2, baz: 3 };
    const objectSanitizedResult = { ...object, baz: SANITIZED_ARG };

    class Target {
      get value() {
        return object;
      }
    }
    const sanitizeResult = jest.fn().mockImplementation((prop: string, result: any) => {
      expect(prop).toBe("value");
      expect(result).not.toBeNull();
      return {
        ...result,
        baz: SANITIZED_ARG,
      };
    });

    const [recorder, entries] = createRecorder(new Target(), {
      sanitizeResult,
    });
    expect(recorder.value).toEqual(objectSanitizedResult);

    expect(entries).toHaveLength(1);
    expect(entries).toMatchInlineSnapshot(`
      Array [
        Object {
          "args": null,
          "isAsync": false,
          "isGetter": true,
          "prop": "value",
          "result": Object {
            "bar": 2,
            "baz": "sanitized",
            "foo": 1,
          },
          "thennable": null,
        },
      ]
    `);

    const player = createPlayer<Target>(serialize(entries));
    expect(player.value).toEqual(objectSanitizedResult);
  });

  test("should enable sanitizing async values", async () => {
    const SANITIZED_ARG = "sanitized";
    const object = { foo: 1, bar: 2, baz: 3 };
    const objectSanitizedResult = { ...object, baz: SANITIZED_ARG };

    class Target {
      async asyncMethod(value: any) {
        return Promise.resolve(value);
      }
    }
    const sanitizeResult = jest.fn().mockImplementation((prop: string, result: any) => {
      expect(prop).toBe("asyncMethod");
      expect(result).not.toBeNull();
      return {
        ...result,
        baz: SANITIZED_ARG,
      };
    });

    const [recorder, entries] = createRecorder(new Target(), {
      sanitizeResult,
    });
    expect(await recorder.asyncMethod(object)).toEqual(objectSanitizedResult);

    expect(entries).toHaveLength(1);
    expect(entries).toMatchInlineSnapshot(`
      Array [
        Object {
          "args": Array [
            Object {
              "bar": 2,
              "baz": 3,
              "foo": 1,
            },
          ],
          "isAsync": true,
          "isGetter": false,
          "prop": "asyncMethod",
          "result": Object {
            "bar": 2,
            "baz": "sanitized",
            "foo": 1,
          },
          "thennable": Promise {},
        },
      ]
    `);

    const player = createPlayer<Target>(serialize(entries));
    expect(await player.asyncMethod(object)).toEqual(objectSanitizedResult);
  });

  test("should notify of pending async requests", async () => {
    type Resolver = (value: any) => void;
    const resolvers: Resolver[] = [];
    class Target {
      async asyncMethod(...rest: any[]) {
        return new Promise(resolve => {
          resolvers.push(resolve);
        });
      }
    }

    let pendingCount = 0;
    const onAsyncRequestPending = jest.fn().mockImplementation(() => {
      pendingCount++;
    });
    const onAsyncRequestResolved = jest.fn().mockImplementation(() => {
      pendingCount--;
    });

    const [recorder] = createRecorder(new Target(), {
      onAsyncRequestPending,
      onAsyncRequestResolved,
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    recorder.asyncMethod();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    recorder.asyncMethod(1);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    recorder.asyncMethod();

    expect(onAsyncRequestPending).toHaveBeenCalledTimes(3);
    expect(onAsyncRequestResolved).toHaveBeenCalledTimes(0);
    expect(resolvers).toHaveLength(3);
    expect(pendingCount).toBe(3);

    resolvers[0]!(1);
    resolvers[1]!(2);

    await waitForPromisesToFlush();

    expect(onAsyncRequestPending).toHaveBeenCalledTimes(3);
    expect(onAsyncRequestResolved).toHaveBeenCalledTimes(2);
    expect(pendingCount).toBe(1);

    resolvers[2]!(1);

    await waitForPromisesToFlush();

    expect(onAsyncRequestPending).toHaveBeenCalledTimes(3);
    expect(onAsyncRequestResolved).toHaveBeenCalledTimes(3);
    expect(pendingCount).toBe(0);
  });

  test("should support functions (e.g. addEventListener)", () => {
    class Target {
      private _handlers: Map<string, Set<Function>> = new Map();
      addEventListener(type: string, handler: Function) {
        if (!this._handlers.has(type)) {
          this._handlers.set(type, new Set());
        }
        this._handlers.get(type)!.add(handler);
      }
      emit(type: string, ...data: any) {
        const set = this._handlers.get(type);
        if (set) {
          set.forEach(handler => handler(...data));
        }
      }
      removeEventListener(type: string, handler: Function) {
        const set = this._handlers.get(type);
        if (set) {
          set.delete(handler);
        }
      }
    }

    const handlerA = jest.fn();
    const handlerB = jest.fn();

    const [recorder, entries] = createRecorder(new Target());
    recorder.addEventListener("change", handlerA);
    recorder.addEventListener("change", handlerB);

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).not.toHaveBeenCalled();

    recorder.emit("change", 111);

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenLastCalledWith(111);
    expect(handlerB).toHaveBeenLastCalledWith(111);

    recorder.emit("change", 222);

    expect(handlerA).toHaveBeenCalledTimes(2);
    expect(handlerA).toHaveBeenCalledTimes(2);
    expect(handlerB).toHaveBeenLastCalledWith(222);
    expect(handlerB).toHaveBeenLastCalledWith(222);

    recorder.removeEventListener("change", handlerA);
    recorder.removeEventListener("change", handlerB);

    recorder.emit("change", 333);

    expect(handlerA).toHaveBeenCalledTimes(2);
    expect(handlerA).toHaveBeenCalledTimes(2);

    // Function instances might not be the same between recorder and player.
    // Note that this further breaks event listener functionality.
    const newHandler = jest.fn();

    const player = createPlayer<Target>(serialize(entries));
    player.addEventListener("change", newHandler);

    player.emit("change", 333);

    // Events won't actually be emitted.
    expect(newHandler).not.toHaveBeenCalled();
  });

  test("should support optional overrides", () => {
    class Target {
      method() {
        return 1;
      }
      methodThatThrows() {
        throw Error("Nope");
      }
    }

    const onEntriesChanged = jest.fn();
    const mock = jest.fn().mockReturnValue(2);

    const [recorder, entries] = createRecorder(
      new Target(),
      { onEntriesChanged },
      {
        methodThatThrows: mock,
      }
    );

    expect(recorder.method()).toBe(1);
    expect(recorder.methodThatThrows()).toBe(2);

    expect(mock).toHaveBeenCalledTimes(1);

    expect(entries).toHaveLength(1);
    expect(onEntriesChanged).toHaveBeenCalledTimes(1);

    const player = createPlayer<Target>(serialize(entries), {
      methodThatThrows: mock,
    });

    expect(player.method()).toBe(1);
    expect(player.methodThatThrows()).toBe(2);

    expect(mock).toHaveBeenCalledTimes(2);
  });

  test("should expose an API to record custom entries", () => {
    class Target {
      method(base: number) {
        return base * 2;
      }
    }

    const target = new Target();
    const onEntriesChanged = jest.fn();

    const [recorder, entries, recordEntry] = createRecorder(
      target,
      { onEntriesChanged },
      {
        method: (...args: any[]) => {
          // @ts-ignore
          const value = target.method(...args);
          recordEntry("method", args, value);
          return value;
        },
      }
    );

    expect(recorder.method(3)).toBe(6);

    expect(entries).toHaveLength(1);
    expect(onEntriesChanged).toHaveBeenCalledTimes(1);

    const player = createPlayer<Target>(serialize(entries));

    expect(player.method(3)).toBe(6);
  });

  test("should support event dispatcher pattern via overrides", () => {
    class Target {
      handlers: { [key: string]: Function[] } = {};
      addEventListener(type: string, handler: Function) {
        if (!this.handlers[type]) {
          this.handlers[type] = [];
        }
        this.handlers[type].push(handler);
      }
      dispatchEvent(type: string, data: any) {
        if (this.handlers[type]) {
          this.handlers[type].forEach(handler => handler(data));
        }
      }
      removeEventListener(type: string, handler: Function) {
        if (this.handlers[type]) {
          const index = this.handlers[type].indexOf(handler);
          if (index !== -1) {
            this.handlers[type].splice(index, 1);
          }
        }
      }
    }

    const [recorder, entries, recordEntry] = createRecorder(
      new Target(),
      {},
      {
        addEventListener() {
          // No point to record this operation ...
        },
        dispatchEvent(type: string, data: any) {
          recordEntry(type, [data], undefined);
        },
        removeEventListener() {
          // No point to record this operation ...
        },
      }
    );

    const typedRecorder = recorder as any;
    typedRecorder.addEventListener("bar", jest.fn());
    typedRecorder.addEventListener("foo", jest.fn());
    typedRecorder.dispatchEvent("bar", "abc");
    typedRecorder.dispatchEvent("foo", true);
    typedRecorder.dispatchEvent("bar", 123);

    // Entries should only contain event data.
    expect(entries).toHaveLength(3);

    const onBar = jest.fn();
    const onFoo = jest.fn();

    const player = createPlayer<Target>(serialize(entries), {
      addEventListener(type: string, handler: Function) {
        entries.forEach(entry => {
          if (entry.prop === type) {
            handler(type, entry.args?.[0]);
          }
        });
      },
      removeEventListener: () => {
        // ...
      },
    });

    const typedPlayer = player as any;
    typedPlayer.addEventListener("bar", onBar);
    typedPlayer.addEventListener("foo", onFoo);

    expect(onBar).toHaveBeenCalledTimes(2);
    expect(onBar).toHaveBeenCalledWith("bar", 123);
    expect(onBar).toHaveBeenCalledWith("bar", "abc");
    expect(onFoo).toHaveBeenCalledTimes(1);
    expect(onFoo).toHaveBeenCalledWith("foo", true);
  });

  // TODO Add a test case for Symbol.Iterator
  // Maybe this isn't needed anymore now that getters are supported?
});
