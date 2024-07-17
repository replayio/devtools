import { Location, TimeStampedPoint } from "@replayio/protocol";

import { getSelectedFrameId } from "devtools/client/debugger/src/selectors";
import { comparePosition } from "devtools/client/debugger/src/utils/location";
import { getPointAndTimeForPauseId } from "replay-next/src/suspense/PauseCache";
import { getSelectedLocation } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

export function useIsCurrentItem(
  timeStampedPoint: TimeStampedPoint | null,
  location: Location | null
) {
  const { pauseId } = useAppSelector(getSelectedFrameId) ?? {};
  const selectedLocation = useAppSelector(getSelectedLocation);

  const [selectedExecutionPoint] = pauseId ? getPointAndTimeForPauseId(pauseId) : [];

  const isMatchingExecutionPoint =
    selectedExecutionPoint != null && timeStampedPoint?.point === selectedExecutionPoint;
  const isMatchingLocation =
    location && selectedLocation && comparePosition(location, selectedLocation);

  return isMatchingExecutionPoint && isMatchingLocation;
}
