const { prefs, features } = require("ui/utils/prefs");

export function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function isPremium() {
  return prefs.premiumFeatures === "premium";
}

export function isNotPremium() {
  return prefs.premiumFeatures === "not-premium";
}

export function isPremiumPrefsEnabled() {
  return ["premium", "not-premium"].includes(prefs.premiumFeatures);
}
