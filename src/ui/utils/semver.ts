// https://www.npmjs.com/package/semver-compare
/**
 * Compares two version strings
 *
 * @param a version string
 * @param b version string
 * @returns 1 if a > b, 0 if a == b, and -1 if a < b
 */
export function semvercmp(a: string, b: string) {
  var pa = a.split(".");
  var pb = b.split(".");
  for (var i = 0; i < 3; i++) {
    var na = Number(pa[i]);
    var nb = Number(pb[i]);
    if (na > nb) {
      return 1;
    }
    if (nb > na) {
      return -1;
    }
    if (!isNaN(na) && isNaN(nb)) {
      return 1;
    }
    if (isNaN(na) && !isNaN(nb)) {
      return -1;
    }
  }
  return 0;
}

/**
 * @param a version string
 * @param b version string
 * @returns `true` if a > b
 */
export function gt(a: string, b: string) {
  return semvercmp(a, b) === 1;
}

/**
 * @param a version string
 * @param b version string
 * @returns `true` if a >= b
 */
export function gte(a: string, b: string) {
  return semvercmp(a, b) > -1;
}
