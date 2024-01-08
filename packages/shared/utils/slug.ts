export const SLUG_SEPARATOR = "--";

export function extractIdAndSlug(params: string | string[] | undefined) {
  const joined = Array.isArray(params) ? params[0] : params;

  let id: string | undefined;
  let slug: string | undefined;
  if (joined) {
    if (validateUUID(joined)) {
      id = joined;
    } else {
      const parts = joined.split(SLUG_SEPARATOR);
      if (validateUUID(parts[1])) {
        slug = parts[0];
        id = parts[1];
      }
    }
  }

  return { id, slug };
}

export function validateUUID(uuid: string) {
  const re = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
  return re.test(uuid);
}
