import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NowPlayingMonitorClient from "@/components/public/NowPlayingMonitorClient";

const COOKIE_NAME = "kiss_monitor_auth";
const DEFAULT_CODE = "kissfm123";

function expectedCode() {
  return process.env.MONITOR_PAGE_CODE?.trim() || DEFAULT_CODE;
}

export const dynamic = "force-dynamic";

export default async function MonitorPage({
  searchParams,
}: {
  searchParams?: { err?: string };
}) {
  const store = await cookies();
  const authed = store.get(COOKIE_NAME)?.value === expectedCode();

  async function loginAction(formData: FormData) {
    "use server";
    const code = String(formData.get("code") || "").trim();
    if (code !== expectedCode()) {
      redirect("/monitor?err=1");
    }
    const c = await cookies();
    c.set(COOKIE_NAME, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/monitor");
  }

  async function logoutAction() {
    "use server";
    const c = await cookies();
    c.delete(COOKIE_NAME);
    redirect("/monitor");
  }

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-[#cfdae8] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#1e375a]">Now Playing monitor</h1>
          <p className="mt-2 text-sm text-gray-600">
            Vul de toegangscode in om deze monitor te openen.
          </p>
          {searchParams?.err === "1" ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              Verkeerde code.
            </p>
          ) : null}
          <form action={loginAction} className="mt-4 space-y-3">
            <input
              name="code"
              type="password"
              placeholder="Toegangscode"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
              required
            />
            <button className="h-10 rounded-full bg-[#1e375a] px-5 text-sm font-black text-white transition hover:bg-[#162b48]">
              Open monitor
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500">
            Standaard code: <span className="font-black">{DEFAULT_CODE}</span>. Aanpasbaar via env <span className="font-black">MONITOR_PAGE_CODE</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#1e375a]">Now Playing monitor (keepalive)</h1>
        <form action={logoutAction}>
          <button className="h-9 rounded-full border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100">
            Uitloggen
          </button>
        </form>
      </div>
      <p className="mb-5 text-sm text-gray-600">
        Laat deze pagina open op de monitor-pc. Hij blijft `/api/now-playing` pollen zodat logging actief blijft.
      </p>
      <NowPlayingMonitorClient />
    </div>
  );
}
