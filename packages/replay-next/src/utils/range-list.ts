export interface Range {
  begin: bigint;
  end: bigint;
}

function min(b1: bigint, b2: bigint) {
  return b1 < b2 ? b1 : b2;
}

function max(b1: bigint, b2: bigint) {
  return b1 > b2 ? b1 : b2;
}

export function isInRange(b: bigint, range: Range) {
  return b >= range.begin && b < range.end;
}

export function getMissingRanges(requested: Range, cached: Range[]): Range[] {
  let index = cached.findIndex(range => BigInt(range.end) > BigInt(requested.begin));
  if (index < 0) {
    return [requested];
  }
  let point: bigint;
  if (cached[index].begin <= requested.begin) {
    point = min(cached[index].end, requested.end);
    index++;
  } else {
    point = requested.begin;
  }
  const missing = [];
  while (point < requested.end && index <= cached.length) {
    if (index === cached.length) {
      missing.push({ begin: point, end: requested.end });
      break;
    }
    missing.push({
      begin: point,
      end: min(cached[index].begin, requested.end),
    });
    point = cached[index].end;
    index++;
  }
  return missing;
}

export function mergeRanges(ranges1: Range[], ranges2: Range[]): Range[] {
  if (ranges1.length === 0) {
    return ranges2;
  } else if (ranges2.length === 0) {
    return ranges1;
  }

  const merged: Range[] = [];
  let point = BigInt(0);
  let index1 = 0;
  let index2 = 0;
  while (index1 < ranges1.length && index2 < ranges2.length) {
    point = min(ranges1[index1].begin, ranges2[index2].begin);
    const begin = point;

    while (true) {
      if (index1 < ranges1.length && BigInt(ranges1[index1].begin) <= BigInt(point)) {
        point = ranges1[index1].end;
      } else if (index2 < ranges2.length && BigInt(ranges2[index2].begin) <= BigInt(point)) {
        point = ranges2[index2].end;
      } else {
        break;
      }
      while (index1 < ranges1.length && BigInt(ranges1[index1].end) <= BigInt(point)) {
        index1++;
      }
      while (index2 < ranges2.length && BigInt(ranges2[index2].end) <= BigInt(point)) {
        index2++;
      }
    }

    const end = point;
    merged.push({ begin, end });
  }

  if (index1 < ranges1.length) {
    merged.push(...ranges1.slice(index1));
  } else if (index2 < ranges2.length) {
    merged.push(...ranges2.slice(index2));
  }

  return merged;
}
