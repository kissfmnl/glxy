import { HomeClassicLayout } from "@/components/public/HomeClassicLayout";
import { getBranding } from "@/lib/brandingDb";

export const dynamic = "force-dynamic";

/** Vaste fallback-route met de originele homepage (artiestenmuur). Ook instelbaar als standaard via HOME_PAGE_LAYOUT=classic. */
export default async function HomeClassicRoutePage() {
  const branding = await getBranding();
  return <HomeClassicLayout homeHlsSrc={branding.homeHlsUrl} />;
}
