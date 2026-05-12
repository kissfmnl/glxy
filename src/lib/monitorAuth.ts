export const MONITOR_AUTH_COOKIE = "kiss_monitor_auth";

export function monitorExpectedCode() {
  return process.env.MONITOR_PAGE_CODE?.trim() || "kissfm123";
}
