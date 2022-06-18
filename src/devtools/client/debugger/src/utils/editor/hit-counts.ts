import { interpolateLab } from "d3-interpolate";
import { getLuminance, darken } from "polished";
import memoize from "lodash/memoize";
import { HitCount } from "@replayio/protocol";

const hitBadge = ["#FFB5DD", "#DB0069"];
const text = ["#FFB5DD", "#DB0069"];

export const getHitCountColors = memoize((hitCounts?: HitCount[]) => {
  if (!hitCounts) {
    return new Map();
  }

  const uniqueHitCounts = Array.from(
    new Set(hitCounts ? hitCounts.map(hitCount => hitCount.hits) : [])
  );
  const maxHitCount = Math.max(...uniqueHitCounts);

  const map = new Map(
    uniqueHitCounts.map(hitCount => {
      const avg = Math.min(1, Math.max(0, Math.log(hitCount) / Math.log(maxHitCount))) || 0;
      const backgroundColor = interpolateLab(hitBadge[0], hitBadge[1])(avg);
      const foregroundColor =
        getLuminance(backgroundColor) > 0.5 ? "rgba(0,0,0,0.97)" : "rgba(255,255,255,.99)";

      const textColor = interpolateLab(text[0], text[1])(avg);
      const textHoverColor = darken("0.2", textColor);

      return [hitCount, { backgroundColor, foregroundColor, textColor, textHoverColor }];
    })
  );

  return map;
});

export function getHitCountsByLine(hitCounts?: HitCount[]): Map<number, number> {
  const hitCountMap: Map<number, number> = new Map();
  if (!hitCounts) {
    return hitCountMap;
  }

  hitCounts.forEach(hitCount => {
    const line = hitCount.location.line;
    hitCountMap.set(line, (hitCountMap.get(line) || 0) + hitCount.hits);
  });
  return hitCountMap;
}
