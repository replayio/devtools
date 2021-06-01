let enableRepaint = false;

export function isRepaintEnabled() {
  return enableRepaint;
}

export function updateEnableRepaint(_enableRepaint: boolean) {
  enableRepaint = _enableRepaint;
}
