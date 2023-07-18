import { setHasAllPaintPoints } from "protocol/graphics";
import { createTestStore } from "test/testUtils";
import { UIStore } from "ui/actions";

import * as actions from "../actions/timeline";
import {
  getCurrentTime,
  getFocusWindow,
  getFocusWindowBackup,
  getHoverTime,
  getPlayback,
  setTimelineState,
} from "./timeline";

describe("Redux timeline state", () => {
  let store = null as unknown as UIStore;
  let dispatch = null as unknown as UIStore["dispatch"];

  beforeEach(async () => {
    store = await createTestStore();

    dispatch = store.dispatch;

    // Fill dummy data in by default.
    dispatch(
      setTimelineState({
        currentTime: 75,
        zoomRegion: { endTime: 100, scale: 1, beginTime: 50 },
      })
    );

    // Fake having loaded paint points.
    setHasAllPaintPoints(true);
  });

  describe("focus region", () => {
    it("should assign a default focusWindow around the current time when toggled on", async () => {
      expect(getFocusWindowBackup(store.getState())).toBeNull();
      await dispatch(actions.toggleFocusMode());
      expect(getFocusWindowBackup(store.getState())).toBeNull();
      expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "67.5",
            "time": 67.5,
          },
          "end": Object {
            "point": "82.5",
            "time": 82.5,
          },
        }
      `);
    });

    it("should not force the currentTime to be within the focusWindow as it moves around", async () => {
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 50,
          end: 60,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);

      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 75,
          end: 85,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);

      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 25,
          end: 30,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);
    });

    it("should update the hoverTime (and the time displayed in the video player) to match the handle being dragged", async () => {
      // If we are moving the whole focus region, seek to the current time.
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 60,
          end: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // If we are moving the beginTime, seek to that point
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 65,
          end: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(65);

      // If we are moving the endTime, seek to that point
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 65,
          end: 75,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // Moving the entire range should not move the hover time,
      // unless the time would otherwise be out of the new focused region.
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 68,
          end: 78,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 80,
          end: 90,
        })
      );
      expect(getHoverTime(store.getState())).toBe(80);
    });

    it("should not allow an invalid focusWindow to be set", async () => {
      // Before the start of the zoom region
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 30,
          end: 40,
        })
      );
      expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "50",
            "time": 50,
          },
          "end": Object {
            "point": "50",
            "time": 50,
          },
        }
      `);

      // After the end of the zoom region
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 110,
          end: 125,
        })
      );
      expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "100",
            "time": 100,
          },
          "end": Object {
            "point": "100",
            "time": 100,
          },
        }
      `);

      // Overlapping
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 60,
          end: 80,
        })
      );
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 90,
          end: 80,
        })
      );
      expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "80",
            "time": 80,
          },
          "end": Object {
            "point": "80",
            "time": 80,
          },
        }
      `);

      // Overlapping alternate
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 60,
          end: 80,
        })
      );
      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 60,
          end: 50,
        })
      );
      expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "60",
            "time": 60,
          },
          "end": Object {
            "point": "60",
            "time": 60,
          },
        }
      `);
    });

    it("should stop playback before resizing focusWindow", async () => {
      dispatch(actions.startPlayback());
      expect(getPlayback(store.getState())).not.toBeNull();

      await dispatch(
        actions.setFocusWindowImprecise({
          begin: 50,
          end: 60,
        })
      );
      expect(getPlayback(store.getState())).toBeNull();
    });

    describe("set start time", () => {
      it("should focus from the start time to the end of the zoom region if no focus region has been set", async () => {
        await dispatch(actions.setFocusWindowBeginTime(65, false));
        expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "65",
              "time": 65,
            },
            "end": Object {
              "point": "100",
              "time": 100,
            },
          }
        `);
      });

      it("should only update the start time when a region is set", async () => {
        await dispatch(
          actions.setFocusWindowImprecise({
            begin: 50,
            end: 70,
          })
        );
        await dispatch(actions.setFocusWindowBeginTime(65, false));
        expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "65",
              "time": 65,
            },
            "end": Object {
              "point": "70",
              "time": 70,
            },
          }
        `);
      });
    });

    describe("set end time", () => {
      it("should focus from the beginning of the zoom region to the specified end time if no focus region has been set", async () => {
        await dispatch(actions.setFocusWindowEndTime(65, false));
        expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "50",
              "time": 50,
            },
            "end": Object {
              "point": "65",
              "time": 65,
            },
          }
        `);
      });

      it("should only update the end time when a region is set", async () => {
        await dispatch(
          actions.setFocusWindowImprecise({
            begin: 50,
            end: 70,
          })
        );
        await dispatch(actions.setFocusWindowEndTime(65, false));
        expect(getFocusWindow(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "50",
              "time": 50,
            },
            "end": Object {
              "point": "65",
              "time": 65,
            },
          }
        `);
      });
    });
  });
});
