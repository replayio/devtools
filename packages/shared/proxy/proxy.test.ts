import createPlayer from "./createPlayer";
import createRecorder, { RecorderAPI } from "./createRecorder";
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
    await expect(await recorder.multiplyByTwo(2)).toBe(4);
    await expect(await recorder.multiplyByTwo(3)).toBe(6);

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    await expect(await player.multiplyByTwo(2)).toBe(4);
    await expect(await player.multiplyByTwo(3)).toBe(6);
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

    await expect(await a).toBe("first");
    await expect(await b).toBe("second");
    await expect(await c).toBe("third");

    const player = createPlayer<Target>(serialize(entries));
    // Only the most recent value should be returned.
    await expect(await player.asyncMethod()).toBe("third");
  });

  test("should return the latest value for a method with multiple matching calls", async () => {
    class Target {
      async multiplyByTwo(number: number) {
        return Promise.resolve(number * 2);
      }
    }

    const [recorder, entries] = createRecorder(new Target());
    await expect(await recorder.multiplyByTwo(2)).toBe(4);
    await expect(await recorder.multiplyByTwo(3)).toBe(6);

    expect(entries).toHaveLength(2);

    const player = createPlayer<Target>(serialize(entries));
    await expect(await player.multiplyByTwo(2)).toBe(4);
    await expect(await player.multiplyByTwo(3)).toBe(6);
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
          "thenable": null,
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
    const returnValue = recorder.process(object);
    expect(returnValue).toEqual(objectSanitizedResult);

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
          "thenable": null,
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
          "thenable": null,
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
    await expect(await recorder.asyncMethod(object)).toEqual(objectSanitizedResult);

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
          "thenable": Promise {},
        },
      ]
    `);

    const player = createPlayer<Target>(serialize(entries));
    await expect(await player.asyncMethod(object)).toEqual(objectSanitizedResult);
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
    recorder.asyncMethod();
    recorder.asyncMethod(1);
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

  test("should support overrides with custom param callbacks", () => {
    class Target {
      method(callbackA: Function, callbackB: Function, number: number) {
        callbackA(number + 1);
        callbackB(number / 2);
        callbackA(number + 2);
        return number * 2;
      }
    }

    const instance = new Target();

    function methodOverride(callbackA: Function, callbackB: Function, number: number) {
      const recorderAPI = arguments[arguments.length - 1] as RecorderAPI;

      const callbackAWrapper = (value: number) => {
        recorderAPI.callParamWithArgs(0, value);
        return callbackA(value);
      };

      const callbackBWrapper = (value: number) => {
        recorderAPI.callParamWithArgs(1, value);
        return callbackB(value);
      };

      return instance.method(callbackAWrapper, callbackBWrapper, number);
    }

    const [recorder, entries] = createRecorder(instance, { overrides: { method: methodOverride } });

    const returnValue = recorder.method(
      () => {},
      () => {},
      10
    );
    expect(returnValue).toBe(20);
    expect(entries).toHaveLength(1);

    const player = createPlayer<Target>(serialize(entries));
    const callbackA = jest.fn();
    const callbackB = jest.fn();
    expect(player.method(callbackA, callbackB, 10)).toBe(20);
    expect(callbackA).toHaveBeenCalledTimes(2);
    expect(callbackA).toHaveBeenCalledWith(11);
    expect(callbackA).toHaveBeenCalledWith(12);
    expect(callbackB).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledWith(5);
  });

  test("should support overrides with custom param callbacks called after return (aka events or debounced)", () => {
    let debouncedCallback = (_: number) => {};
    let flushRecord = () => {};

    class Target {
      method(callback: Function, number: number) {
        debouncedCallback = (value: number) => callback(value);
        return number * 2;
      }
    }

    const instance = new Target();

    function methodOverride(callback: Function, number: number) {
      const recorderAPI = arguments[arguments.length - 1] as RecorderAPI;

      flushRecord = recorderAPI.holdUntil();

      const callbackWrapper = (value: number) => {
        recorderAPI.callParamWithArgs(0, value);
        return callback(value);
      };

      return instance.method(callbackWrapper, number);
    }

    const [recorder, entries] = createRecorder(instance, { overrides: { method: methodOverride } });

    const returnValue = recorder.method(() => {}, 10);
    expect(returnValue).toBe(20);
    expect(entries).toHaveLength(0);
    debouncedCallback(5);
    debouncedCallback(15);
    flushRecord();
    expect(entries).toHaveLength(1);

    const player = createPlayer<Target>(serialize(entries));
    const callback = jest.fn();
    expect(player.method(callback, 10)).toBe(20);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(5);
    expect(callback).toHaveBeenCalledWith(15);
  });

  // TODO Add a test case for Symbol.Iterator
  // Maybe this isn't needed anymore now that getters are supported?
});
