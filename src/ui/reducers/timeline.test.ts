import { setHasAllPaintPoints } from "protocol/graphics";
import { createTestStore } from "test/testUtils";
import { UIStore } from "ui/actions";

import * as actions from "../actions/timeline";

import {
  getCurrentTime,
  getFocusRegion,
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
    it("should assign a default focusRegion around the current time when toggled on", () => {
      expect(getFocusRegion(store.getState())).toBeNull();
      dispatch(actions.toggleFocusMode());
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "0",
            "time": 0,
          },
          "beginTime": 70,
          "end": Object {
            "point": "",
            "time": 80,
          },
          "endTime": 80,
        }
      `);
    });

    it("should not force the currentTime to be within the focusRegion as it moves around", () => {
      dispatch(
        actions.setFocusRegion({
          beginTime: 50,
          endTime: 60,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);

      dispatch(
        actions.setFocusRegion({
          beginTime: 75,
          endTime: 85,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);

      dispatch(
        actions.setFocusRegion({
          beginTime: 25,
          endTime: 30,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);
    });

    it("should update the hoverTime (and the time displayed in the video player) to match the handle being dragged", () => {
      // If we are moving the whole focus region, seek to the current time.
      dispatch(
        actions.setFocusRegion({
          beginTime: 60,
          endTime: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // If we are moving the beginTime, seek to that point
      dispatch(
        actions.setFocusRegion({
          beginTime: 65,
          endTime: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(65);

      // If we are moving the endTime, seek to that point
      dispatch(
        actions.setFocusRegion({
          beginTime: 65,
          endTime: 75,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // Moving the entire range should not move the hover time,
      // unless the time would otherwise be out of the new focused region.
      dispatch(
        actions.setFocusRegion({
          beginTime: 68,
          endTime: 78,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);
      dispatch(
        actions.setFocusRegion({
          beginTime: 80,
          endTime: 90,
        })
      );
      expect(getHoverTime(store.getState())).toBe(80);
    });

    it("should not allow an invalid focusRegion to be set", () => {
      // Before the start of the focus window
      dispatch(
        actions.setFocusRegion({
          beginTime: 30,
          endTime: 40,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "0",
            "time": 0,
          },
          "beginTime": 50,
          "end": Object {
            "point": "",
            "time": 50,
          },
          "endTime": 50,
        }
      `);

      // After the end of the focus window
      dispatch(
        actions.setFocusRegion({
          beginTime: 110,
          endTime: 125,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "0",
            "time": 0,
          },
          "beginTime": 110,
          "end": Object {
            "point": "",
            "time": 110,
          },
          "endTime": 110,
        }
      `);

      // Overlapping
      dispatch(
        actions.setFocusRegion({
          beginTime: 60,
          endTime: 80,
        })
      );
      dispatch(
        actions.setFocusRegion({
          beginTime: 90,
          endTime: 80,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "0",
            "time": 0,
          },
          "beginTime": 80,
          "end": Object {
            "point": "",
            "time": 80,
          },
          "endTime": 80,
        }
      `);

      // Overlapping alternate
      dispatch(
        actions.setFocusRegion({
          beginTime: 60,
          endTime: 80,
        })
      );
      dispatch(
        actions.setFocusRegion({
          beginTime: 60,
          endTime: 50,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "begin": Object {
            "point": "0",
            "time": 0,
          },
          "beginTime": 60,
          "end": Object {
            "point": "",
            "time": 60,
          },
          "endTime": 60,
        }
      `);
    });

    it("should stop playback before resizing focusRegion", () => {
      dispatch(actions.startPlayback());
      expect(getPlayback(store.getState())).not.toBeNull();

      dispatch(
        actions.setFocusRegion({
          beginTime: 50,
          endTime: 60,
        })
      );
      expect(getPlayback(store.getState())).toBeNull();
    });

    describe("set start time", () => {
      it("should focus from the start time to the end of the zoom region if no focus region has been set", () => {
        dispatch(actions.setFocusRegionBeginTime(65, false));
        expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "0",
              "time": 0,
            },
            "beginTime": 65,
            "end": Object {
              "point": "",
              "time": 100,
            },
            "endTime": 100,
          }
        `);
      });

      it("should only update the start time when a region is set", () => {
        dispatch(
          actions.setFocusRegion({
            beginTime: 50,
            endTime: 70,
          })
        );
        dispatch(actions.setFocusRegionBeginTime(65, false));
        expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "0",
              "time": 0,
            },
            "beginTime": 65,
            "end": Object {
              "point": "",
              "time": 70,
            },
            "endTime": 70,
          }
        `);
      });
    });

    describe("set end time", () => {
      it("should focus from the beginning of the zoom region to the specified end time if no focus region has been set", () => {
        dispatch(actions.setFocusRegionEndTime(65, false));
        expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "0",
              "time": 0,
            },
            "beginTime": 50,
            "end": Object {
              "point": "",
              "time": 65,
            },
            "endTime": 65,
          }
        `);
      });

      it("should only update the end time when a region is set", () => {
        dispatch(
          actions.setFocusRegion({
            beginTime: 50,
            endTime: 70,
          })
        );
        dispatch(actions.setFocusRegionEndTime(65, false));
        expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
          Object {
            "begin": Object {
              "point": "0",
              "time": 0,
            },
            "beginTime": 50,
            "end": Object {
              "point": "",
              "time": 65,
            },
            "endTime": 65,
          }
        `);
      });
    });
  });
});
