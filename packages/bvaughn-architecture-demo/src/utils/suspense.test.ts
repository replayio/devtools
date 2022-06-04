import { createWakeable, suspendInParallel } from "./suspense";

describe("Suspense util", () => {
  describe("createWakeable", () => {
    it("should call registered listeners when rejected", () => {
      const onFulfillA = jest.fn();
      const onFulfillB = jest.fn();
      const onRejectA = jest.fn();
      const onRejectB = jest.fn();

      const wakeable = createWakeable();
      wakeable.then(onFulfillA, onRejectA);
      wakeable.then(onFulfillB, onRejectB);

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();

      wakeable.reject("This is an error");

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).toHaveBeenCalledWith("This is an error");
      expect(onRejectB).toHaveBeenCalledWith("This is an error");
    });

    it("should call registered listeners when resolved", () => {
      const onFulfillA = jest.fn();
      const onFulfillB = jest.fn();
      const onRejectA = jest.fn();
      const onRejectB = jest.fn();

      const wakeable = createWakeable();
      wakeable.then(onFulfillA, onRejectA);
      wakeable.then(onFulfillB, onRejectB);

      expect(onFulfillA).not.toHaveBeenCalled();
      expect(onFulfillB).not.toHaveBeenCalled();
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();

      wakeable.resolve();

      expect(onFulfillA).toHaveBeenCalled();
      expect(onFulfillB).toHaveBeenCalled();
      expect(onRejectA).not.toHaveBeenCalled();
      expect(onRejectB).not.toHaveBeenCalled();
    });
  });

  describe("suspendInParallel", () => {
    it("should call all callbacks before re-throwing any thrown value", () => {
      const callbackA = jest.fn();
      const callbackB = jest.fn().mockImplementation(() => {
        throw Error("Expected error");
      });
      const callbackC = jest.fn();

      expect(() => {
        suspendInParallel(callbackA, callbackB, callbackC);
      }).toThrow("Expected error");

      expect(callbackA).toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalled();
      expect(callbackC).toHaveBeenCalled();
    });

    it("should return all values if none of the callbacks suspend", () => {
      const callbackA = () => 123;
      const callbackB = () => "abc";

      const [a, b] = suspendInParallel(callbackA, callbackB);

      expect(a).toEqual(123);
      expect(b).toEqual("abc");
    });
  });
});
