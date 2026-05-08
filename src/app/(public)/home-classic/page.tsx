import { HomeClassicLayout } from "@/components/public/HomeClassicLayout";

export const dynamic = "force-dynamic";

/** Vaste fallback-route met de originele homepage (artiestenmuur). Ook instelbaar als standaard via HOME_PAGE_LAYOUT=classic. */
export default function HomeClassicRoutePage() {
  return <HomeClassicLayout />;
}
