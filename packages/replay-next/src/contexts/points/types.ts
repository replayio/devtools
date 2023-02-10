import { Location } from "@replayio/protocol";

import { Badge, Point, PointBehavior, PointKey } from "shared/client/types";

export type PointBehaviorsObject = { [key: PointKey]: PointBehavior };

export type AddPoint = (
  partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>,
  partialPointBehavior: Partial<Omit<PointBehavior, "pointId">>,
  location: Location
) => void;

export type DeletePoints = (...pointIds: PointKey[]) => void;

export type EditPointBadge = (key: PointKey, badge: Badge | null) => void;

export type EditPointText = (
  key: PointKey,
  partialPoint: Partial<Pick<Point, "condition" | "content">>
) => void;

export type EditPointBehavior = (
  key: PointKey,
  pointBehavior: Partial<Omit<PointBehavior, "pointId">>
) => void;

export type EditPointDangerousToUseDirectly = (
  key: PointKey,
  partialPoint: Partial<Pick<Point, "badge" | "condition" | "content">>
) => void;
