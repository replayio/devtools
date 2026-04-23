// persists ad-campaign click IDs and utm params captured from the URL so
// we can fire a segment `Created Account` event with attribution after
// the user completes the auth0 round-trip. first-touch only: once set,
// the payload survives until clearAdAttribution() wipes it (normally
// right after the recordFirstLogin mutation succeeds).

export type AdAttribution = {
  li_fat_id: string | null;
  twclid: string | null;
  rdt_cid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type AdAttributionInput = {
  liClickId: string | null;
  xClickId: string | null;
  redditClickId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

const STORAGE_KEY = "replay_ad_attribution";
const AD_PARAMS = ["li_fat_id", "twclid", "rdt_cid"] as const;
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function captureAdAttribution(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const hasAny = [...AD_PARAMS, ...UTM_PARAMS].some(k => params.get(k));
  if (!hasAny) return;

  const attribution: AdAttribution = {
    li_fat_id: params.get("li_fat_id"),
    twclid: params.get("twclid"),
    rdt_cid: params.get("rdt_cid"),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
}

export function readAdAttribution(): AdAttribution | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdAttribution;
  } catch {
    return null;
  }
}

export function clearAdAttribution(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function toAdAttributionInput(a: AdAttribution): AdAttributionInput {
  return {
    liClickId: a.li_fat_id,
    xClickId: a.twclid,
    redditClickId: a.rdt_cid,
    utmSource: a.utm_source,
    utmMedium: a.utm_medium,
    utmCampaign: a.utm_campaign,
    utmContent: a.utm_content,
    utmTerm: a.utm_term,
  };
}
