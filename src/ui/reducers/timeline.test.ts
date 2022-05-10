import { configureStore, EnhancedStore, Reducer, ThunkDispatch } from "@reduxjs/toolkit";
import { UIAction } from "ui/actions";
import { UIState } from "ui/state";
import { ThunkExtraArgs } from "ui/utils/thunk";

import * as actions from "../actions/timeline";

import appReducer from "./app";
import timelineReducer, {
  getCurrentTime,
  getFocusRegion,
  getHoverTime,
  getPlayback,
} from "./timeline";

type UIStateReducers = {
  [key in keyof UIState]: Reducer<UIState[key]>;
};

describe("Redux timeline state", () => {
  let dispatch = null as unknown as ThunkDispatch<UIState, ThunkExtraArgs, UIAction>;
  let store = null as unknown as EnhancedStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        app: appReducer,
        timeline: timelineReducer,
      } as unknown as UIStateReducers,
    });

    dispatch = store.dispatch;

    // Fill dummy data in by default.
    dispatch(
      actions.setTimelineState({
        currentTime: 75,
        zoomRegion: { endTime: 100, scale: 1, startTime: 50 },
      })
    );
  });

  describe("focus region", () => {
    it("should assign a default focusRegion around the current time when toggled on", () => {
      expect(getFocusRegion(store.getState())).toBeNull();
      dispatch(actions.toggleFocusMode());
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "endTime": 80,
          "startTime": 70,
        }
      `);
    });

    it("should keep the currentTime within the focusRegion as it moves around", () => {
      dispatch(
        actions.setFocusRegion({
          startTime: 50,
          endTime: 60,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(60);

      dispatch(
        actions.setFocusRegion({
          startTime: 65,
          endTime: 60,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(60);

      dispatch(
        actions.setFocusRegion({
          startTime: 75,
          endTime: 85,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);

      dispatch(
        actions.setFocusRegion({
          startTime: 75,
          endTime: 80,
        })
      );
      expect(getCurrentTime(store.getState())).toBe(75);
    });

    it("should update the hoverTime (and the time displayed in the video player) to match the handle being dragged", () => {
      // If we are moving the whole focus region, seek to the current time.
      dispatch(
        actions.setFocusRegion({
          startTime: 60,
          endTime: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // If we are moving the startTime, seek to that point
      dispatch(
        actions.setFocusRegion({
          startTime: 65,
          endTime: 80,
        })
      );
      expect(getHoverTime(store.getState())).toBe(65);

      // If we are moving the endTime, seek to that point
      dispatch(
        actions.setFocusRegion({
          startTime: 65,
          endTime: 75,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);

      // Moving the entire range should not move the hover time,
      // unless the time would otherwise be out of the new focused region.
      dispatch(
        actions.setFocusRegion({
          startTime: 68,
          endTime: 78,
        })
      );
      expect(getHoverTime(store.getState())).toBe(75);
      dispatch(
        actions.setFocusRegion({
          startTime: 80,
          endTime: 90,
        })
      );
      expect(getHoverTime(store.getState())).toBe(80);
    });

    it("should not allow an invalid focusRegion to be set", () => {
      // Before the start of the focus window
      dispatch(
        actions.setFocusRegion({
          startTime: 30,
          endTime: 40,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "endTime": 50,
          "startTime": 50,
        }
      `);

      // After the end of the focus window
      dispatch(
        actions.setFocusRegion({
          startTime: 110,
          endTime: 125,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "endTime": 110,
          "startTime": 110,
        }
      `);

      // Overlapping
      dispatch(
        actions.setFocusRegion({
          startTime: 60,
          endTime: 80,
        })
      );
      dispatch(
        actions.setFocusRegion({
          startTime: 90,
          endTime: 80,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "endTime": 80,
          "startTime": 80,
        }
      `);

      // Overlapping alternate
      dispatch(
        actions.setFocusRegion({
          startTime: 60,
          endTime: 80,
        })
      );
      dispatch(
        actions.setFocusRegion({
          startTime: 60,
          endTime: 50,
        })
      );
      expect(getFocusRegion(store.getState())).toMatchInlineSnapshot(`
        Object {
          "endTime": 60,
          "startTime": 60,
        }
      `);
    });

    it("should stop playback before resizing focusRegion", () => {
      dispatch(actions.startPlayback());
      expect(getPlayback(store.getState())).not.toBeNull();

      dispatch(
        actions.setFocusRegion({
          startTime: 50,
          endTime: 60,
        })
      );
      expect(getPlayback(store.getState())).toBeNull();
    });
  });
});
