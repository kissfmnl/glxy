"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MONITOR_AUTH_COOKIE, monitorExpectedCode } from "@/lib/monitorAuth";

function safeReturnTo(raw: string): string {
  const t = raw.trim();
  if (t === "/monitor" || t === "/playlist-monitor") return t;
  return "/playlist-monitor";
}

export async function monitorLoginAction(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/playlist-monitor"));
  if (code !== monitorExpectedCode()) {
    redirect(`${returnTo}?err=1`);
  }
  const c = await cookies();
  c.set(MONITOR_AUTH_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(returnTo);
}

export async function monitorLogoutAction(formData: FormData) {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/playlist-monitor"));
  const c = await cookies();
  c.delete(MONITOR_AUTH_COOKIE);
  redirect(returnTo);
}
