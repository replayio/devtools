import { RenderResult, act, render as rtlRender } from "@testing-library/react";
import { useEffect } from "react";

import useDebounceState, { DebounceState } from "replay-next/src/hooks/useDebounceState";

type Value = string;

describe("useDebounceState", () => {
  let currentState: DebounceState<Value> = null as any as DebounceState<Value>;
  let rendered: RenderResult | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    currentState = null as any as DebounceState<Value>;
    rendered = null;
  });

  function Component({ defaultValue, interval }: { defaultValue?: Value; interval?: number }) {
    const state = useDebounceState(defaultValue, interval);

    useEffect(() => {
      currentState = state;
    });

    return null;
  }

  function render(defaultValue?: Value, interval?: number) {
    act(() => {
      if (rendered === null) {
        rendered = rtlRender(<Component defaultValue={defaultValue} interval={interval} />);
      } else {
        rendered.rerender(<Component defaultValue={defaultValue} interval={interval} />);
      }
    });
  }

  it("should not debounce the initial value", async () => {
    render("initial");
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("initial");
  });

  it("should correctly update values at high priority", async () => {
    render("initial");

    act(() => {
      currentState.setValue("update");
    });
    expect(currentState.debouncedValue).toEqual("update");
    expect(currentState.value).toEqual("update");
  });

  it("should correctly update values at low-priority", async () => {
    render("initial");

    act(() => {
      currentState.setValueDebounced("update");
    });
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("update");

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("update");

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("update");
    expect(currentState.value).toEqual("update");
  });

  it("should replace pending low-priority updates another low-priority update is received", async () => {
    render("initial");

    act(() => {
      currentState.setValueDebounced("update one");
    });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("update one");

    act(() => {
      currentState.setValueDebounced("update two");
    });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("update two");

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("update two");
    expect(currentState.value).toEqual("update two");
  });

  it("should cancel pending low-priority updates when a high-priority update is received", async () => {
    render("initial");

    act(() => {
      currentState.setValueDebounced("update one");
    });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(currentState.debouncedValue).toEqual("initial");
    expect(currentState.value).toEqual("update one");

    act(() => {
      currentState.setValue("update two");
    });
    expect(currentState.debouncedValue).toEqual("update two");
    expect(currentState.value).toEqual("update two");

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(currentState.debouncedValue).toEqual("update two");
    expect(currentState.value).toEqual("update two");
  });
});
